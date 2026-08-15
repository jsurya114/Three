import { ComputerAction } from './schema';
import { ActionValidator } from './ActionValidator';
import { PermissionManager } from '../permission/PermissionManager';
import { BridgeClient } from '../bridge/BridgeClient';
import { BrowserProvider } from '../browser/BrowserProvider';

export class ActionExecutor {
  private validator: ActionValidator;
  
  constructor(
    private permissionManager: PermissionManager,
    private bridgeClient: BridgeClient,
    private browserProvider: BrowserProvider
  ) {
    this.validator = new ActionValidator();
  }

  /**
   * Execute an action after validating permissions.
   */
  async execute(action: ComputerAction, sessionId: string, userId: string): Promise<any> {
    const { scope, operation, resource } = this.validator.getPermissionRequirements(action);
    
    const allowed = await this.permissionManager.requirePermission(scope, operation, resource, action.reason);
    if (!allowed) {
      throw new Error(`Permission denied for action: ${action.type} on ${resource}`);
    }

    // Map the Action to Native execution or Browser execution
    switch (action.type) {
      case 'OPEN_APPLICATION':
        return this.bridgeClient.invokeCommand('open_application', { name: action.args.name });
      case 'CLOSE_APPLICATION':
        return this.bridgeClient.invokeCommand('close_application', { name: action.args.name });
      case 'FOCUS_APPLICATION':
        return this.bridgeClient.invokeCommand('focus_application', { name: action.args.name });
      case 'IS_APPLICATION_RUNNING':
        return this.bridgeClient.invokeCommand('is_application_running', { name: action.args.name });
      case 'LIST_APPLICATIONS':
        return this.bridgeClient.invokeCommand('list_applications', {});
      case 'OPEN_FILE':
        return this.bridgeClient.invokeCommand('open_file', { path: action.args.path });
      case 'OPEN_DIRECTORY':
        return this.bridgeClient.invokeCommand('open_folder', { path: action.args.path });
      case 'READ_FILE':
        return this.bridgeClient.invokeCommand('read_file', { path: action.args.path });
      case 'CREATE_FILE':
        return this.bridgeClient.invokeCommand('create_file', { path: action.args.path, content: action.args.content || '' });
      case 'WRITE_FILE':
        return this.bridgeClient.invokeCommand('write_file', { path: action.args.path, content: action.args.content });
      case 'DELETE_FILE':
        return this.bridgeClient.invokeCommand('delete_file', { path: action.args.path });
      case 'FIND_FILE':
        return this.bridgeClient.invokeCommand('find_files', { path: action.args.path, pattern: action.args.pattern });
      case 'MOVE_FILE':
        return this.bridgeClient.invokeCommand('move_file', { source: action.args.source, destination: action.args.destination });
      case 'RENAME_FILE':
        return this.bridgeClient.invokeCommand('rename_file', { path: action.args.path, new_name: action.args.newName });
      
      case 'CLIPBOARD_READ':
        return this.bridgeClient.invokeCommand('get_clipboard', {});
      case 'CLIPBOARD_WRITE':
        return this.bridgeClient.invokeCommand('set_clipboard', { text: action.args.text });
      
      case 'SCREENSHOT':
        return this.bridgeClient.invokeCommand('take_screenshot', { savePath: action.args.savePath });
        
      case 'BROWSER_OPEN':
        await this.browserProvider.openBrowser(action.args.profileId);
        return { success: true, message: 'Browser opened' };
      case 'BROWSER_NAVIGATE':
        await this.browserProvider.navigate(action.args.url);
        return { success: true, message: `Navigated to ${action.args.url}` };
      case 'BROWSER_READ_PAGE':
        const pageData = await this.browserProvider.readPage();
        return { success: true, message: pageData };
      case 'BROWSER_SEARCH':
        await this.browserProvider.search(action.args.query);
        return { success: true, message: `Searched for ${action.args.query}` };

      case 'MEDIA_PLAY':
        // As per prompt, use browser for media play if applicable
        if (action.args.platform === 'youtube') {
          await this.browserProvider.search(action.args.query + ' youtube');
          return { success: true, message: `Searched YouTube for ${action.args.query}` };
        } else {
          return this.bridgeClient.invokeCommand('media_play', { query: action.args.query });
        }
        
      default:
        throw new Error(`Unsupported action type: ${(action as any).type}`);
    }
  }
}
