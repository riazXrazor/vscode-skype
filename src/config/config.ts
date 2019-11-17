import { workspace } from "vscode";

export interface SkypeConfig {
  "user.username": string;
  "user.password": string;
}

export interface SkypeUser {
  "user.id": string;
  "user.label": string;
}

export const CUSTOM_SKYPE_CONFIG = {
  "user.username": "custom",
  "user.password": ""
};

const CONFIG_LIST_KEY = "configList";
const USER_LIST_KEY = "userList";

export function getConfig() {
  return workspace.getConfiguration("vscode-skype");
}

export function generateSkypeConfigKey(c: SkypeConfig) {
  return `${c["user.username"]} ${c["user.password"]}`;
}

export function getConfigList(): SkypeConfig[] {
  return getConfig().get<SkypeConfig[]>(CONFIG_LIST_KEY);
}

export function getUserList(): SkypeUser[] {
  return getConfig().get<SkypeUser[]>(USER_LIST_KEY);
}

export function updateConfigList(configList: SkypeConfig[]): Thenable<void> {
  return getConfig().update(CONFIG_LIST_KEY, configList, true);
}

export function updateUserList(userList: SkypeUser): Thenable<void> {
  return getConfig().update(USER_LIST_KEY, userList, true);
}
