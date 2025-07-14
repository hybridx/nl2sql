import readline from "readline/promises";
import { MCPService } from "./services/MCPService.js";
import { LLMService } from "./services/LLMService.js";
import { ToolService } from "./services/ToolService.js";
import { formatToolResult } from "./utils/formatters.js";
import { config } from "./config/config.js";

class MCPClient {
  private mcpService: MCPService;
  private llmService: LLMService;
  private toolService: ToolService;

  constructor() {
    this.mcpService = new MCPService();
    this.llmService = new LLMService(() => this.mcpService.tools);
    this.toolService = new ToolService();
  }

  async initialize(serverScriptPath: string): Promise<void> {
    await this.mcpService.connectToServer(serverScriptPath);
    this.llmService.initializeSystemPrompt();
    
    console.log(
      "Connected to server with tools:",
      this.mcpService.tools.map(({ name }) => name)
    );
  }

  async processQuery(query: string): Promise<string> {
    try {
      const ollamaResponse = await this.llmService.callModelAPI(query);
      const responseContent = ollamaResponse.message?.content || "No response";
  
      const toolCalls = this.toolService.parseToolCalls(ollamaResponse);
  
      if (!toolCalls) {
        return responseContent;
      }
  
      let finalResponse = `${responseContent}\n\n`;
  
      // Process each tool call
      for (const toolCall of toolCalls) {
        const toolName = toolCall.name;
        const toolArgs = this.toolService.normalizeToolArguments(toolCall.arguments);
  
        finalResponse += `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]\n`;
  
        // Call the tool and get the result
        const result = await this.mcpService.callTool(toolName, toolArgs);
        const formattedResult = formatToolResult(result);
  
        finalResponse += `\nTool result:\n${formattedResult}\n`;
  
        // Add the tool result to conversation history
        this.llmService.addSystemMessage(`Tool result from ${toolName}: ${formattedResult}`);
  
        const analysisPrompt = `Analyze the following data and provide insights:\n${formattedResult}`;
        const analysisResponse = await this.llmService.callModelAPI(analysisPrompt);
        const analysisContent = analysisResponse.message?.content || "No analysis provided.";
  
        finalResponse += `\nAnalysis:\n${analysisContent}`;
      }
  
      return finalResponse;
    } catch (error) {
      return `An error occurred while processing your query: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async chatLoop(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\nMCP Client with Ollama Started!");
      console.log(`Using Ollama model: ${config.ollama.model}`);
      console.log("Type your queries or 'quit' to exit.");

      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "quit") {
          break;
        }
        const response = await this.processQuery(message);
        console.log("\n" + response);
      }
    } finally {
      rl.close();
    }
  }

  async cleanup(): Promise<void> {
    await this.mcpService.cleanup();
  }
}

async function main(): Promise<void> {
  if (process.argv.length < 3) {
    console.log("Usage: node index.ts <path_to_server_script>");
    return;
  }
  
  const mcpClient = new MCPClient();
  
  try {
    await mcpClient.initialize(process.argv[2]);
    await mcpClient.chatLoop();
  } finally {
    await mcpClient.cleanup();
    process.exit(0);
  }
}

main();