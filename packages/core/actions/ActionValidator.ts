import { ComputerActionArraySchema, ComputerAction, getActionRiskLevel } from './schema';
import { PermissionScope, PermissionOperation } from '../permission/types';

export class ActionValidator {
  
  /**
   * Parse a JSON string from the LLM and validate it strictly against the Zod schema.
   */
  public parseAndValidate(jsonString: string): ComputerAction[] {
    try {
      let parsedJSON = JSON.parse(jsonString);
      // If the LLM returns a single object instead of an array, wrap it
      if (!Array.isArray(parsedJSON) && typeof parsedJSON === 'object') {
        parsedJSON = [parsedJSON];
      }
      
      // Validate array of actions
      return ComputerActionArraySchema.parse(parsedJSON);
    } catch (error: any) {
      throw new Error(`Action validation failed: ${error.message}`);
    }
  }

  /**
   * Determine the required permissions for a given action.
   */
  public getPermissionRequirements(action: ComputerAction): { scope: PermissionScope, operation: PermissionOperation, resource: string } {
    switch (action.type) {
      case 'OPEN_APPLICATION':
      case 'CLOSE_APPLICATION':
      case 'FOCUS_APPLICATION':
      case 'IS_APPLICATION_RUNNING':
        return { scope: PermissionScope.APPLICATION, operation: PermissionOperation.APPLICATION_OPEN, resource: action.args.name };
      case 'LIST_APPLICATIONS':
        return { scope: PermissionScope.SYSTEM_ACTION, operation: PermissionOperation.SYSTEM_READ, resource: 'process_list' };
      
      case 'OPEN_FILE':
      case 'READ_FILE':
        return { scope: PermissionScope.FILE, operation: PermissionOperation.FILE_READ, resource: action.args.path };
      case 'WRITE_FILE':
      case 'CREATE_FILE':
        return { scope: PermissionScope.FILE, operation: PermissionOperation.FILE_WRITE, resource: action.args.path };
      case 'RENAME_FILE':
        return { scope: PermissionScope.FILE, operation: PermissionOperation.FILE_WRITE, resource: action.args.path };
      case 'DELETE_FILE':
        return { scope: PermissionScope.FILE, operation: PermissionOperation.FILE_DELETE, resource: action.args.path };
      case 'MOVE_FILE':
        return { scope: PermissionScope.FILE, operation: PermissionOperation.FILE_WRITE, resource: action.args.source }; // Simplification, would need both in advanced

      case 'OPEN_DIRECTORY':
      case 'FIND_FILE':
        return { scope: PermissionScope.DIRECTORY, operation: PermissionOperation.DIRECTORY_READ, resource: action.args.path };

      case 'CLIPBOARD_READ':
        return { scope: PermissionScope.TOOL, operation: PermissionOperation.CLIPBOARD_READ, resource: 'clipboard' };
      case 'CLIPBOARD_WRITE':
        return { scope: PermissionScope.TOOL, operation: PermissionOperation.CLIPBOARD_WRITE, resource: 'clipboard' };

      case 'SCREENSHOT':
        return { scope: PermissionScope.TOOL, operation: PermissionOperation.SCREENSHOT_CAPTURE, resource: 'screen' };

      case 'BROWSER_OPEN':
      case 'BROWSER_NAVIGATE':
      case 'BROWSER_READ_PAGE':
      case 'BROWSER_SEARCH':
        return { scope: PermissionScope.BROWSER_PROFILE, operation: PermissionOperation.BROWSER_CONTROL, resource: 'browser' };

      case 'MEDIA_PLAY':
        return { scope: PermissionScope.APPLICATION, operation: PermissionOperation.APPLICATION_OPEN, resource: action.args.platform || 'media' };
        
      default:
        throw new Error(`Unknown permission mapping for action type: ${(action as any).type}`);
    }
  }
}
