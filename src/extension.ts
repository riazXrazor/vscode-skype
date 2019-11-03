'use strict';
import * as vscode from 'vscode';
import { Api, connect } from "skype-http";
import { getConfigList,getUserList, updateConfigList, CUSTOM_SKYPE_CONFIG, SkypeConfig, SkypeUser, updateUserList, generateSkypeConfigKey } from './config/config';

 const MESSAGE_PREFIX = "vscode-skype: ";

 let timeoutId: NodeJS.Timer;
 let api: Api;
 let StatusBarItemNotify: any;
// this method is called when your extension is activated
// extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
   
    console.log(`${MESSAGE_PREFIX}activated !!`);
    

    const checkForConfig = async () => {

        try {

                const configList = getConfigList();
                if (!configList || !configList.length) {
                    await setSkypeConfig();
                } else {
                    console.log(`${MESSAGE_PREFIX}Config already exists. : ${JSON.stringify(configList, null, 2)}`);
                    const credentials: any  = configList[0];
                    StatusBarItemNotify.text = "Fetching Skype Contacts...";
                    StatusBarItemNotify.show();
                    api = api || await connect({credentials: { username: credentials['user.username'], password: credentials['user.password'] }});
                    StatusBarItemNotify.text = "";
                    StatusBarItemNotify.hide();
                    const contacts: SkypeUser = await getSkypeContacts();
                    updateUserList(contacts);
                } 
            
        } catch (_ignorred) {
            console.log(`${MESSAGE_PREFIX}Error while trying to checkForConfig. ${JSON.stringify(_ignorred)}`);
        } 
    };

    timeoutId = setTimeout(checkForConfig, 0);

    
    
    const setSkypeConfig = async () => {
      
        const configList = getConfigList();
        const setSkypeConfig = async (newConfig: SkypeConfig) => {
            try {
                const newConfigKey = generateSkypeConfigKey(newConfig);
                if (!configList.find((c) => generateSkypeConfigKey(c) === newConfigKey)) {
                    configList.push(newConfig);
                    await updateConfigList(configList);
                }

            } catch (e) {
                vscode.window.showErrorMessage('Failed to set skype credentials.', e);
                return false;
            }
            vscode.window.showInformationMessage('Skype credentials successfully set.');
            return true;
        };

        const customSetSkypeConfig = async (usernamed?: string) => {
            const username = usernamed || await vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: 'user.username: "riaz@optimizeitsystems.com"', prompt: 'Enter username/phone/email that you use for your skype account.' });
            if (!username) {
                vscode.window.showInformationMessage('user.username should not be empty');
                customSetSkypeConfig();
                return;
            }
            const password = await vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: 'user.password: "12345@abc"', prompt: 'Enter password that you use for your skype account.' });
            if(!password) {
                vscode.window.showInformationMessage('user.password should not be empty');
                customSetSkypeConfig(username);
                return;
            }
            try{
                StatusBarItemNotify.text = "Verifying skype credentials...";
                StatusBarItemNotify.show();
                api = api || await connect({credentials: { username: username, password: password }});
               
                const newConfig: SkypeConfig = {
                    "user.username": username,
                    "user.password": password
                };
                await setSkypeConfig(newConfig);
            } catch(e){
                vscode.window.showErrorMessage('Invalid skype credentials.', e);
            } finally {
                StatusBarItemNotify.text = "";
                StatusBarItemNotify.hide();
            }
        };
        
        if (configList.length) {
            const map: Map<string, SkypeConfig> = configList.concat(CUSTOM_SKYPE_CONFIG).reduce((map, c) => {
                map.set(generateSkypeConfigKey(c), c);
                return map;
            }, new Map<string, SkypeConfig>());
            const pick = await vscode.window.showQuickPick(Array.from(map.keys()), { ignoreFocusOut: true, placeHolder: 'Select one of previous configs or new custom one.' });
            if (pick === generateSkypeConfigKey(CUSTOM_SKYPE_CONFIG)) {
                await customSetSkypeConfig();
            } else {
                await setSkypeConfig(map.get(pick));
            }
        } else {
            await customSetSkypeConfig();
        } 
    };

    const sendMessage = async () => {
        try {
            const msg = await vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: 'Type your message', prompt: 'Enter the skype message' });
            let contacts: any = getUserList();
            const pickContacts: any = await vscode.window.showQuickPick(contacts, { ignoreFocusOut: true, placeHolder: 'Select contact to send the message: ' });
            if(pickContacts){
                await api.sendMessage({textContent: msg}, pickContacts.id);
                vscode.window.showInformationMessage(`Skype message successfully sent to ${pickContacts.label}`);
            }
        } catch (_ignorred) {
            console.log(`${MESSAGE_PREFIX}Error while sending message. ${JSON.stringify(_ignorred)}`);
        }
    };

    function createStatusBarItem(): void {
        
        StatusBarItemNotify = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        StatusBarItemNotify.text = "";

        let toggleTerminalStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        toggleTerminalStatusBarItem.command = "vscode-skype.sendMessage";
        toggleTerminalStatusBarItem.text = " Skype ";
        toggleTerminalStatusBarItem.tooltip = "Skype";
        toggleTerminalStatusBarItem.show();

    }

    //commands

    const getConfigCommand = vscode.commands.registerCommand('vscode-skype.getConfig', async () => {
        setSkypeConfig();
    });

    const setConfigCommand = vscode.commands.registerCommand('vscode-skype.setConfig', async () => {
        await setSkypeConfig();
    });

    const sendMessageCommand = vscode.commands.registerCommand('vscode-skype.sendMessage', async () => {
        await sendMessage();
    });
    createStatusBarItem();
    context.subscriptions.push(getConfigCommand, setConfigCommand, sendMessageCommand);
   

    async function getSkypeContacts(){
        const contacts: any = [];
        for (const contact of await api.getContacts()) {
            if(!contacts[contact.mri]){
                contacts.push({id: contact.mri, label: contact.displayName});
            }
        }

        for (const contact of await api.getConversations()) {
            if(contact.threadProperties){
                contacts.push({id: contact.id, label: contact.threadProperties.topic});
            }
        }

        return contacts;
    }

}

// this method is called when your extension is deactivated
export function deactivate() {
     clearTimeout(timeoutId); 
}

