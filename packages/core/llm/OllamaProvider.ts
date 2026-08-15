import { ModelProvider, ModelMessage } from './ModelProvider';

export class OllamaProvider implements ModelProvider {
  private apiUrl: string;
  private model: string;

  constructor(model: string = 'qwen2.5:1.5b', apiUrl: string = 'http://localhost:11434') {
    this.model = model;
    this.apiUrl = apiUrl;
  }

  async generateStructuredCompletion(messages: ModelMessage[], systemPrompt: string): Promise<string> {
    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      format: "json",
      stream: false,
      options: {
        temperature: 0.1
      }
    };

    try {
      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message.content;
    } catch (error: any) {
      throw new Error(`Failed to generate completion from Ollama: ${error.message}`);
    }
  }
}
