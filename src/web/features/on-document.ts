import vscode, { DecorationOptions, ExtensionContext, Position, TextDocument, Uri, window, workspace } from "vscode";
import { Address, FilesystemsState } from "../types";
import { getPrimitiveProperties, getPropertyDeclarations } from "../utils/ast";
import { SourceUnit, TypeName } from "solidity-ast";
import { getAdapter } from "../adapters";
import { RpcService } from "../services/rpc";
import { decorationType } from "../utils/decoration-style";

export default async function onDocument(doc: TextDocument, filesystems: FilesystemsState, context: ExtensionContext, save: boolean): Promise<DecorationOptions[] | undefined> {
  const address = doc.uri.scheme as Address;
  console.log("OnDocument start");

  if (!filesystems.has(address)) {
    return;
  }

  const { sources, adapter } = filesystems.get(address)!;
  const mainFile = sources.find(source => source.name !== null);
  const fullPath = doc.uri.path.slice(1);

  // Save changes in workspaceState if file has been saved
  if (save) {
    const source = sources.find(source => (source.path === fullPath || source.path === `/${mainFile?.name}/${fullPath}`));
    if (source) {
      source.content = doc.getText();
    }
    filesystems.set(address, { sources, adapter });
    context.workspaceState.update('filesystems', Array.from(filesystems.entries()));
  }

  // Only display properties if the file is the main file as this is the only file that properties can be retrieved from
  if (fullPath !== mainFile?.path) {
    return;
  }
  
  return displayPropertiesValues(doc, context, adapter);
}

async function displayPropertiesValues(doc: TextDocument, context: ExtensionContext, adapterId: number): Promise<DecorationOptions[] | undefined> {
  try {
    const adapter = getAdapter(adapterId)!;
    const version = retrieveVersion(doc.getText());
    const ast = await extractAST(context, version, doc.getText());
    console.log("AST", ast);
    const properties = getPropertyDeclarations(ast);
    console.log("Properties", properties);

    const primitiveProperties = getPrimitiveProperties(properties);

    console.log("Primitive Properties", primitiveProperties);

    const rpcService = new RpcService(adapter.chain!);
    const contractAddress = doc.uri.scheme as Address;
    const decorationsArray: vscode.DecorationOptions[] = [];

    for (const property of primitiveProperties) {
      const value = await rpcService.getPropertyValue(contractAddress, property.name, (property.typeName! as TypeName & { name: string }).name);
      
      const startIdx = parseInt(property.src.split(':')[0]);
      const start = doc.positionAt(startIdx);
      const end = new Position(start.line, doc.lineAt(start.line).text.length);
      const range = new vscode.Range(start, end);

      let decoration: DecorationOptions = {
        range,
        renderOptions: {
          after: { contentText: `    ${value}`, },
        },
      };
      decorationsArray.push(decoration);
    }
    window.visibleTextEditors.forEach(editor => {
      if (editor.document.uri.toString() === doc.uri.toString()) {
        editor.setDecorations(decorationType, decorationsArray);
      }
    });
    return decorationsArray;
  } catch (error: any) {
    vscode.window.showErrorMessage("An error occurred during property hydration, check output");
    console.error(error);
  }
}

async function saveCompilerBinary(context: ExtensionContext, version: string): Promise<string> {
  const url = await getMatchingCompilerUrl(version);
  const res = await fetch(url);
  const blob = await res.blob();

  return URL.createObjectURL(blob);

}

async function getMatchingCompilerUrl(version: string): Promise<string> {
  const res = await fetch('https://solc-bin.ethereum.org/bin/list.json');
  const data = await res.json();

  const releases = data.builds;
  const release = releases.find((release: any) => {
    if (version === 'latest')
      return release.version === data.latestRelease
    else
      return release.version === version && release.prerelease === undefined
  });

  if (release === undefined) {
    throw new Error(`Version ${version} not found`);
  }
  return `https://binaries.soliditylang.org/bin/${release.path}`;
}

async function extractAST(context: ExtensionContext, version: string,  content: string): Promise<SourceUnit> {
  return new Promise(async (resolve, reject) => {
    try {
      const workerPath = Uri.joinPath(context.extensionUri, 'dist/web/compiler-worker.js');
      const binaryPath = await saveCompilerBinary(context, version);
      const worker = new Worker(workerPath.toString(true));

      worker.addEventListener('message', function (e: any) {
        console.log('Worker message', e.data);
        if (e.data.error) {
          reject(e.data.error);
        } else {
          resolve(e.data.data);
        }
      }, false);

      worker.postMessage({
        binaryPath,
        content
      });
    } catch (error) {
      reject(error);
    }
  });
}

function retrieveVersion(content: string): string {
  const reg = "pragma solidity \\^?(.*);"
  return content.match(reg)![1] || 'latest';
}

