export interface AgentContext {
  taskId: string;
  workspacePath: string;
}

export interface AgentResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface SpecialistAgent {
  name: string;
  description: string;
  
  /**
   * Initializes the agent, checking dependencies.
   */
  initialize(): Promise<void>;

  /**
   * Executes a command specific to this agent.
   */
  execute(command: string, context: AgentContext): Promise<AgentResult>;
}
