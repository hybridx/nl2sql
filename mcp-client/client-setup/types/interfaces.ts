export interface Tool {
    name: string;
    description: string;
    inputSchema: any;
    input_schema?: any;
  }
  
  export interface ToolCall {
    name: string;
    arguments: Record<string, any>;
  }
  
  export interface Message {
    role: string;
    content: string;
  }
  
  export interface OllamaResponse {
    message?: {
      content: string;
      role: string;
    };
    model: string;
    created_at: string;
    done: boolean;
  }
  
  export interface ToolResult {
    content: any;
    isError?: boolean;
  }