'use strict';
import * as vscode from 'vscode';

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('ashd-foldplus.grepinfile', () => {
        warnFoldStrategy();
        foldOnGrep();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('ashd-foldplus.toggle.indentation', async () => {
        const newValue = await settingsCycleNext('editor', 'foldingStrategy', ['auto', 'indentation'])
        vscode.window.showInformationMessage('Set Folding Strategy: ' + newValue)
    });
    context.subscriptions.push(disposable);

    //console.log('REGISTER folding range invoked'); // comes here on every character edit
    disposable = vscode.languages.registerFoldingRangeProvider('*', {
        provideFoldingRanges(document, context, token) {
            //console.log('folding range invoked'); // comes here on every character edit

            const editor = vscode.window.activeTextEditor;
            let cursorPosition = editor.selection.start;
            let wordRange = editor.document.getWordRangeAtPosition(cursorPosition);
            let highlight = editor.document.getText(wordRange);
            const text = editor.document.getText();



            let FR = [];

            let lineCount = editor.document.lineCount;
            let start = 0;
            let length = 0;

            //console.log("Current highlight is " + highlight);
            //console.log("Length is "+highlight.length);            
            
            for (let lineNumber = 0; lineNumber < lineCount; lineNumber++)  {
                let lineText = document.lineAt(lineNumber);
                let isinline = lineText.text.indexOf(highlight);
                if (isinline >= 0) {
                    //console.log("Hit at " + lineNumber + " len was " + length);
                    FR.push(new vscode.FoldingRange(start, start+length, vscode.FoldingRangeKind.Region));
                    start = lineNumber;
                    length = 0;
                }
                else {
                    length++;
                }
            }

            if (length != 0) {
                FR.push(new vscode.FoldingRange(start, start+length, vscode.FoldingRangeKind.Region));
            }
            return FR;
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}

function warnFoldStrategy() {
    const currentFoldingStrategy = vscode.workspace.getConfiguration('editor').get('foldingStrategy')
    if (currentFoldingStrategy === 'indentation')
        vscode.window.showWarningMessage("Grep In File Fold features require 'auto' folding.  Use command `GrepInFileFold: Toggle Indentation/Language Folding` to set 'auto' folding when using.")
}

function foldOnGrep() {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    let cursorPosition = textEditor.selection.start;
    let wordRange = textEditor.document.getWordRangeAtPosition(cursorPosition);
    let highlight = textEditor.document.getText(wordRange);

    var patt1 = /\n/;
    var result = highlight.search(patt1);
    
    if (result != -1)
    {
        vscode.window.showWarningMessage("Invalid Highlight selection for Fold on Grep command.")
        return;
    }
    
    textEditor.edit(editBuilder => editBuilder.replace(textEditor.selection, highlight));
    return __awaiter(this, void 0, void 0, function* () {
        yield vscode.commands.executeCommand('editor.foldAll');
    });    
}

/**
     * Cycle through a set of possible settings values for whatever is the most local defined scope
     * @param values 
     * @param section 
     * @param property 
     */
    export async function settingsCycleNext(section:string, property:string, values: any[]) {
        const settingsConfig = vscode.workspace.getConfiguration(section).inspect(property)
        let targetScope = vscode.ConfigurationTarget.Global
        if (settingsConfig.workspaceValue) targetScope = vscode.ConfigurationTarget.Workspace
        if (settingsConfig.workspaceFolderValue) targetScope = vscode.ConfigurationTarget.WorkspaceFolder

        const currentValue = vscode.workspace.getConfiguration(section).get(property)
        const valueIndex = values.indexOf(currentValue)
        const nextIndex = valueIndex === values.length - 1 ? 0 : valueIndex + 1
        const nextValue = values[nextIndex]
        
        await vscode.workspace.getConfiguration(section).update(property, nextValue, targetScope)
        return nextValue
    }

