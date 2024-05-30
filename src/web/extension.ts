// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Address, FilesystemsState } from './types';
import openContract from './features/open-contract';
import restoreFilesystems from './features/restore-filesystems';
import onDocument from './features/on-document';
import { decorationType } from './utils/decoration-style';
import OpenContractParams from './types/open-contract-params';

let filesystems: FilesystemsState = new Map();
let registeredSchemes: Address[] = [];
let decorations = new Map<vscode.Uri, vscode.DecorationOptions[]>();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	filesystems = new Map(context.globalState.get('filesystems') ?? []);
	console.log('filesystems', Array.from(filesystems.entries()));
	registeredSchemes = registeredSchemes.concat(restoreFilesystems(filesystems, context, registeredSchemes));

	// Free state if the folder is removed
	context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(({ added, removed }) => {
		console.warn('Workspace folders removed', removed);
		removed.forEach(folder => {
			console.log('Removing folder', folder.uri.scheme);
			const address = folder.uri.scheme as Address;
			filesystems.delete(address);
		});
		if (added.length > 0) {
			registeredSchemes = registeredSchemes.concat(restoreFilesystems(filesystems, context, registeredSchemes));
		}
		context.workspaceState.update('filesystems', Array.from(filesystems.entries()));
	}));

	context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((document) => {
		if (decorations.has(document.uri)) {
			vscode.window.activeTextEditor?.setDecorations(decorationType, decorations.get(document.uri)!);
		} else {
			onDocument(document, filesystems, context, false).then((dec) => decorations.set(document.uri, dec ?? []))
		}
	}));
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document) => {
		if (decorations.has(document.uri)) {
			vscode.window.activeTextEditor?.setDecorations(decorationType, decorations.get(document.uri)!);
		} else {
			onDocument(document, filesystems, context, true).then((dec) => decorations.set(document.uri, dec ?? []))
		}
	}));
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor) {
			const doc = editor.document;
			if (decorations.has(doc.uri))
				editor.setDecorations(decorationType, decorations.get(doc.uri)!);
		}
	}));

	
	context.subscriptions.push(vscode.commands.registerCommand('contracts-voyager.openContract', async (params?: OpenContractParams) => openContract(filesystems, context, params)));
}

// This method is called when your extension is deactivated
export function deactivate() {

}
