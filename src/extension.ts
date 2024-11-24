import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const registerCommand = (
    command: string,
    handler: (...args: any[]) => any,
  ) => {
    const disposable = vscode.commands.registerCommand(command, handler);
    context.subscriptions.push(disposable);
  };

  registerCommand('sistrum.codeMode', codeMode);
  registerCommand('sistrum.extensionMode', extensionMode);
  registerCommand('sistrum.overtypeMode', overtypeMode);
  registerCommand('sistrum.replaceMode', replaceMode);
  registerCommand('sistrum.searchNextMode', searchNextMode);
  registerCommand('sistrum.searchPrevMode', searchPrevMode);

  registerCommand('sistrum.searchNext', ({ text }) =>
    gotoFirstMatchBy(text, searchNext),
  );
  registerCommand('sistrum.searchPrev', ({ text }) =>
    gotoFirstMatchBy(text, searchPrev),
  );
  registerCommand('sistrum.overtype', ({ text }) => overtype(text));
  registerCommand('sistrum.replace', ({ text }) => replace(text));
  registerCommand('sistrum.nop', () => {});

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      extensionMode();
    }
  });

  extensionMode();
  setContext('sistrum.enabled', true);
}

export function deactivate() {}

function codeMode() {
  setCursorStyle(vscode.TextEditorCursorStyle.Line);
  setContext('sistrum.mode', 'code');
}

function extensionMode() {
  setCursorStyle(vscode.TextEditorCursorStyle.Block);
  setContext('sistrum.mode', 'extension');
}

function overtypeMode() {
  setCursorStyle(vscode.TextEditorCursorStyle.Underline);
  setContext('sistrum.mode', 'overtype');
}

function replaceMode() {
  setCursorStyle(vscode.TextEditorCursorStyle.Underline);
  setContext('sistrum.mode', 'replace');
}

function searchNextMode() {
  setCursorStyle(vscode.TextEditorCursorStyle.BlockOutline);
  setContext('sistrum.mode', 'searchNext');
}

function searchPrevMode() {
  setCursorStyle(vscode.TextEditorCursorStyle.BlockOutline);
  setContext('sistrum.mode', 'searchPrev');
}

type SearchFunction = (line: string, from: number, text: string) => number;

async function gotoFirstMatchBy(text: string, f: SearchFunction) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    editor.selections = searchTextBy(editor, text, f);
    extensionMode();
  }
}

function searchTextBy(
  editor: vscode.TextEditor,
  text: string,
  f: SearchFunction,
): vscode.Selection[] {
  return editor.selections.map((sel) => {
    const col = f(
      editor.document.lineAt(sel.active.line).text,
      sel.active.character,
      text,
    );
    const pos = new vscode.Position(sel.active.line, col);
    return new vscode.Selection(pos, pos);
  });
}

function searchNext(line: string, from: number, text: string): number {
  for (let i = from + 1; i < line.length; i++) {
    if (line.slice(i, i + text.length) === text) {
      return i;
    }
  }
  return from;
}

function searchPrev(line: string, from: number, text: string): number {
  for (let i = from - 1; i >= 0; i--) {
    if (line.slice(i, i + text.length) === text) {
      return i;
    }
  }
  return from;
}

function overtype(text: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  vscode.commands.executeCommand('cursorRight');
  vscode.commands.executeCommand('replacePreviousChar', {
    text: text,
    replaceCharCnt: text.length,
  });
}

function replace(text: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  overtype(text);
  vscode.commands.executeCommand('cursorLeft');
  extensionMode();
}

async function setContext(name: string, value: boolean | string) {
  await vscode.commands.executeCommand('setContext', name, value);
}

function setCursorStyle(style: vscode.TextEditorCursorStyle) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  editor.options = {
    cursorStyle: style,
  };
}
