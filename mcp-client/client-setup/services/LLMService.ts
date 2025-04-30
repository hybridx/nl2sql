import fetch from "node-fetch";
import { Message, OllamaResponse } from "../types/interfaces.js";
import { config } from "../config/config.js";

export class LLMService {
  private messageHistory: Message[] = [];

  constructor(private tools: () => any[]) {}

  initializeSystemPrompt(): void {
    const toolsDescription = this.tools().map(tool => 
      `Tool: ${tool.name}\nDescription: ${tool.description}\nInput Schema: ${JSON.stringify(tool.inputSchema, null, 2)}`
    ).join("\n\n");
    
    const systemPrompt = `You are an assistant with access to the following tools: ${toolsDescription}
        When you need to use a tool, respond using this exact JSON format:
        {
          "tool_calls": [
            {
              "name": "tool_name",
              "arguments": {
                "arg1": "value1",
                "arg2": "value2"
              }
            }
          ]
        }

        Only use tool_calls when a query requires external data. Otherwise, respond normally.`;

    this.messageHistory.push({ role: "system", content: systemPrompt });
  }

  async callModelAPI(prompt: string): Promise<OllamaResponse> {
    try {
      this.messageHistory.push({ role: "user", content: prompt });
      
      const response = await fetch(`${config.ollama.apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.ollama.model,
          messages: this.messageHistory,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${errorText}`);
      }

      const ollamaResponse = await response.json() as OllamaResponse;
      
      if (ollamaResponse.message) {
        this.messageHistory.push({ 
          role: ollamaResponse.message.role, 
          content: ollamaResponse.message.content 
        });
      }

      return ollamaResponse;
    } catch (error) {
      console.error("Error calling Ollama API:", error);
      throw error;
    }
  }

  addSystemMessage(content: string): void {
    this.messageHistory.push({ role: "system", content });
  }

  clearHistory(): void {
    this.messageHistory = [];
    this.initializeSystemPrompt();
  }

  getHistory(): Message[] {
    return [...this.messageHistory];
  }
}