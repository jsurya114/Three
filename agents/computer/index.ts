import { SpecialistAgent, AgentContext, AgentResult } from '../../packages/types/agent';
import { PermissionManager } from '../../packages/core/permission/PermissionManager';
import { BridgeClient } from '../../packages/core/bridge/BridgeClient';
import { ModelProvider } from '../../packages/core/llm/ModelProvider';
import { ActionExecutor } from '../../packages/core/actions/ActionExecutor';
import { ActionValidator } from '../../packages/core/actions/ActionValidator';
import { BrowserProvider } from '../../packages/core/browser/BrowserProvider';

export class ComputerAgent implements SpecialistAgent {
  name = 'ComputerAgent';
  description = 'Handles application launching, file management, screenshots, clipboard operations, and browser control.';
  
  private actionExecutor: ActionExecutor;
  private actionValidator: ActionValidator;

  constructor(
    private permissionManager: PermissionManager,
    private bridgeClient: BridgeClient,
    private browserProvider: BrowserProvider,
    private modelProvider?: ModelProvider
  ) {
    this.actionExecutor = new ActionExecutor(this.permissionManager, this.bridgeClient, this.browserProvider);
    this.actionValidator = new ActionValidator();
  }

  async initialize(): Promise<void> {
    console.log(`${this.name} initialized.`);
  }

  async execute(command: string, context: AgentContext): Promise<AgentResult> {
    try {
      // If no model is provided, fallback to direct JSON parsing (for testing)
      let jsonPlan = command;

      if (this.modelProvider && !command.trim().startsWith('[')) {
        const systemPrompt = `You are the Computer Agent Action Planner.
Your job is to convert natural language requests into a strict JSON array of ComputerAction objects.
Action types: OPEN_APPLICATION, CLOSE_APPLICATION, FOCUS_APPLICATION, IS_APPLICATION_RUNNING, LIST_APPLICATIONS, OPEN_FILE, OPEN_DIRECTORY, FIND_FILE, READ_FILE, CREATE_FILE, WRITE_FILE, MOVE_FILE, RENAME_FILE, DELETE_FILE, CLIPBOARD_READ, CLIPBOARD_WRITE, SCREENSHOT, BROWSER_OPEN, BROWSER_NAVIGATE, BROWSER_READ_PAGE, BROWSER_SEARCH, MEDIA_PLAY.
Each action must have: { "type": "...", "args": {}, "resource": "...", "reason": "..." }.
Ensure args match the expected schema for the type (e.g. { "name": "App Name" } for OPEN_APPLICATION).
Return ONLY the JSON array.`;

        jsonPlan = await this.modelProvider.generateStructuredCompletion(
          [{ role: 'user', content: command }],
          systemPrompt
        );
      }

      // 1. Validate
      const actions = this.actionValidator.parseAndValidate(jsonPlan);

      // 2. Execute sequentially
      const results: any[] = [];
      for (const action of actions) {
        console.log(`[ComputerAgent] Executing Action: ${action.type} on ${action.resource}`);
        const res = await this.actionExecutor.execute(action, context.sessionId, context.userId || 'system');
        results.push(res);
      }

      return { success: true, message: JSON.stringify(results) };
    } catch (e: any) {
      return { success: false, message: `Action failed: ${e.message}` };
    }
  }
}
