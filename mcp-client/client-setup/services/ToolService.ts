import { ToolCall, OllamaResponse } from "../types/interfaces.js";

export class ToolService {
  parseToolCalls(ollamaResponse: OllamaResponse): ToolCall[] | null {
    const content = ollamaResponse.message?.content || "";
    
    try {
      // Look for JSON pattern in the response
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*"tool_calls"[\s\S]*})/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[2];
        const parsedJson = JSON.parse(jsonStr);
        
        if (parsedJson.tool_calls && Array.isArray(parsedJson.tool_calls)) {
          return parsedJson.tool_calls as ToolCall[];
        }
      }
      
      // Alternative: Check if entire response is a JSON object
      if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
        try {
          const parsedJson = JSON.parse(content);
          if (parsedJson.tool_calls && Array.isArray(parsedJson.tool_calls)) {
            return parsedJson.tool_calls as ToolCall[];
          }
        } catch (e) {
          // Ignore parsing errors for this attempt
        }
      }
    } catch (e) {
      console.log("No valid tool calls found in response");
    }
    
    return null;
  }

  normalizeToolArguments(args: Record<string, any>): Record<string, any> {
    const normalizedArgs: Record<string, any> = {};
  
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string' && !isNaN(Number(value))) {
        normalizedArgs[key] = Number(value);
      } else if (typeof value === 'object' && value !== null) {
        normalizedArgs[key] = this.normalizeToolArguments(value);
      } else {
        normalizedArgs[key] = value;
      }
    }
  
    return normalizedArgs;
  }
}