import vscode, { ExtensionContext } from "vscode";
import { MemFS } from "../services/filesystem-provider";
import { FilesystemsState, Address, FileSource } from "../types";

export default function restoreFilesystems(filesystems: FilesystemsState, context: vscode.ExtensionContext, alreadyRegistered: Address[]): Address[] {
  try {
    const registeredSchemes: Address[] = []

    console.log('Already registered', alreadyRegistered);

    if (filesystems.size > 0) {
      vscode.workspace.workspaceFolders?.forEach(workspace => {
        const address = workspace.uri.scheme as Address;

        if (alreadyRegistered.includes(address)) {
          return;
        }
        registeredSchemes.push(address);

        if (filesystems.has(address)) {
          const { sources } = filesystems.get(address)!;
          const memFS = new MemFS();
          context.subscriptions.push(vscode.workspace.registerFileSystemProvider(address, memFS, { isCaseSensitive: true }));
          addFilesystemSources(memFS, sources, address);
        }
      });
    }

    console.log('Restored filesystems', registeredSchemes);
    return registeredSchemes;
  } catch (e: any) {
    console.log('Restoring filesystems error');
    console.error(e);
    if (e) {
      console.log('Restoring filesystems error 2');
      vscode.window.showErrorMessage(e.toString());
    }
    return [];
  }
}

async function addFilesystemSources(fs: MemFS, sources: FileSource[], address: Address) {
  const mainFile = sources.find(source => source.name !== null);

  sources.forEach(source => {
    let directories = source.path.split('/').slice(0, -1);
    let fullPath = source.path;

    // Remove prefix that woul be redundant with the workspace folder name
    if (mainFile?.name && directories[0] === mainFile.name) {
      directories = directories.slice(1);
      fullPath = fullPath.replace(new RegExp(`^/?${mainFile.name}/`), '');
    }

    for (let i = 0; i < directories.length; i++) {
      const path = vscode.Uri.parse(`${address}:/${directories.slice(0, i + 1).join('/')}`);
      try {
        fs.stat(path);
      } catch (e) {
        console.log('Creating directory', path);
        fs.createDirectory(path);
      }
    }
    console.log('Writing file', source.path);
    fs.writeFile(vscode.Uri.parse(`${address}:/${fullPath}`), new TextEncoder().encode(source.content), { create: true, overwrite: true });
  });

  if (mainFile?.path.search(`^/?${mainFile.name}/`) === 0) {
    mainFile.path = mainFile.path.replace(new RegExp(`^/?${mainFile.name}/`), '');
  }
  await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${address}:/${mainFile?.path}`));
}