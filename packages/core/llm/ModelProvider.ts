export interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelProvider {
  /**
   * Generates a completion based on the given messages.
   * Enforces JSON structured output if requested.
   */
  generateStructuredCompletion(messages: ModelMessage[], systemPrompt: string): Promise<string>;
}
