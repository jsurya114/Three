import { SpecialistAgent, AgentContext, AgentResult } from '../../packages/types/agent';

export class ResearchAgent implements SpecialistAgent {
  name = 'ResearchAgent';
  description = 'Handles general questions, web research, and reasoning.';

  async initialize(): Promise<void> {
    console.log(`${this.name} initialized.`);
  }

  async execute(command: string, context: AgentContext): Promise<AgentResult> {
    return {
      success: false,
      message: 'ResearchAgent is a skeleton and not fully implemented yet.',
    };
  }
}
