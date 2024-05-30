import vscode, { ExtensionContext } from "vscode";
import adapters, { IAdapter, getAdapter } from "../adapters";
import { Address } from "../types/address";
import { FilesystemsState } from "../types";

export default async function openContract(filesystems: FilesystemsState, context: ExtensionContext, params?: { address: Address, adapterId: number }) {
  try {
    let adapter, address;

    if (params && params.address && params.adapterId !== undefined) {
      adapter = getAdapter(params.adapterId)!;
      address = params.address;
    } else {
      const selection = await getContractSelection();
      adapter = selection.adapter;
      address = selection.address;
    }
    const sources = await adapter.getSources(address);
    const mainFile = sources.find(source => source.name !== null);
    const adapterIndex = adapters.indexOf(adapter);

    filesystems.set(address, { sources, adapter: adapterIndex});
    context.globalState.update('filesystems', Array.from(filesystems.entries()))
      .then(() => vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse(`${address}:/`), name: `${mainFile?.name} - ${address}` }));
  } catch (e: any) {
    console.error(e);
    if (e) {
      vscode.window.showErrorMessage(e.toString());
    }
  }
}

function getContractSelection(): Promise<{ adapter: IAdapter, address: Address }> {
  return new Promise((resolve, reject) => {
    vscode.window.showInputBox({ prompt: 'Enter the contract address', ignoreFocusOut: true }).then(address => {
      if (!address) {
        reject();
        return;
      }
      if (!/^(0x)?[0-9a-fA-F]{40}$/.test(address)) {
        reject('Invalid address');
        return;
      }

      const picks = adapters.map(adapter => ({
        label: adapter.chain!,
        description: `${adapter.explorer}${adapter.description ? ` - ${adapter.description}` : ''}`,
        adapter,
      }));

      vscode.window.showQuickPick(picks, { ignoreFocusOut: true }).then((pick) => {
        if (!pick) {
          reject('No adapter selected');
          return;
        }

        resolve({ adapter: pick.adapter, address: address as Address });
      });
    });
  });
}