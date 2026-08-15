import { SpecialistAgent, AgentContext, AgentResult } from '../../packages/types/agent';

export class EmailAgent implements SpecialistAgent {
  name = 'EmailAgent';
  description = 'Handles reading, searching, summarizing, drafting, and sending emails via Gmail OAuth.';

  async initialize(): Promise<void> {
    console.log(`${this.name} initialized.`);
  }

  async execute(command: string, context: AgentContext): Promise<AgentResult> {
    return {
      success: false,
      message: 'EmailAgent is a skeleton and not fully implemented yet.',
    };
  }
}
