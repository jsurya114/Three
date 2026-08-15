import { invoke } from '@tauri-apps/api/core';
import { SpecialistAgent, AgentContext, AgentResult } from '../../packages/types/agent';

export class ComputerAgent implements SpecialistAgent {
  name = 'ComputerAgent';
  description = 'Handles application launching, file management, screenshots, and clipboard operations.';

  async initialize(): Promise<void> {
    console.log(`${this.name} initialized. Native bindings ready.`);
  }

  async execute(command: string, context: AgentContext): Promise<AgentResult> {
    try {
      // Very basic command parsing for Phase 1 MVP
      // E.g., "open_application:Spotify", "take_screenshot:/tmp/test.png"
      const [action, ...args] = command.split(':');
      const arg = args.join(':');

      switch (action) {
        case 'open_application':
          return await this.invokeCommand('open_application', { name: arg });
        case 'close_application':
          return await this.invokeCommand('close_application', { name: arg });
        case 'open_file':
          return await this.invokeCommand('open_file', { path: arg });
        case 'open_folder':
          return await this.invokeCommand('open_folder', { path: arg });
        case 'take_screenshot':
          return await this.invokeCommand('take_screenshot', { savePath: arg || '/tmp/screenshot.png' });
        case 'get_clipboard':
          return await this.invokeCommand('get_clipboard', {});
        case 'set_clipboard':
          return await this.invokeCommand('set_clipboard', { text: arg });
        // other commands would parse multiple args appropriately
        default:
          return { success: false, message: `Unknown computer command: ${action}` };
      }
    } catch (e: any) {
      return { success: false, message: `Error executing ${command}: ${e}` };
    }
  }

  private async invokeCommand(command: string, args: Record<string, any>): Promise<AgentResult> {
    try {
      const result = await invoke<string>(command, args);
      return { success: true, message: result };
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  }
}
