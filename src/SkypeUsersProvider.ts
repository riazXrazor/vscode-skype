import * as vscode from "vscode";
import * as path from "path";
import { getUserList } from "./config/config";

export class SkypeUsersProvider implements vscode.TreeDataProvider<Dependency> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    Dependency | undefined
  > = new vscode.EventEmitter<Dependency | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Dependency | undefined> = this
    ._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<Dependency[]> {
    let contacts: any = getUserList();

    return contacts.map(({ id, label, icon }: any) => {
      return new Dependency(
        label,
        id,
        icon,
        vscode.TreeItemCollapsibleState.None,
        {
          command: "vscode-skype.sendMessageTo",
          title: "",
          arguments: [id, label]
        }
      );
    });
  }
}

export class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    private icon: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    return `${this.label}-${this.version}`;
  }

  get description(): string {
    return this.version;
  }

  get iconPath() {
    if (!this.icon) {
      return path.join(__filename, "..", "..", "..", "media", "group.svg");
    }
    return vscode.Uri.parse(this.icon);
  }

  contextValue = "skypeuser";
}
