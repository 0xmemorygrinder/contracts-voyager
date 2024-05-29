import * as vscode from "vscode";

export const decorationType = vscode.window.createTextEditorDecorationType({
  after: {
    color: "rgba(255, 255, 255, 0.5)",
  },
});