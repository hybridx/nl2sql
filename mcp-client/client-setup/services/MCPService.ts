import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool, ToolResult } from "../types/interfaces.js";
import { config } from "../config/config.js";

export class MCPService {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private _tools: Tool[] = [];

  constructor() {
    this.client = new Client({
      name: config.mcp.clientName,
      version: config.mcp.version
    });
  }

  get tools(): Tool[] {
    return this._tools;
  }

  async connectToServer(serverScriptPath: string): Promise<void> {
    const isJs = serverScriptPath.endsWith(".js");
    const isPy = serverScriptPath.endsWith(".py");
    
    if (!isJs && !isPy) {
      throw new Error("Server script must be a .js or .py file");
    }
    
    const command = isPy
      ? process.platform === "win32"
        ? "python"
        : "python3"
      : process.execPath;

    this.transport = new StdioClientTransport({
      command,
      args: [serverScriptPath],
    });
    
    await this.client.connect(this.transport);
    await this.loadTools();
  }

  private async loadTools(): Promise<void> {
    const toolsResult = await this.client.listTools();
    this._tools = toolsResult.tools.map((tool: any) => {
      return {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        input_schema: tool.inputSchema,
      };
    });
  }

  async callTool(name: string, args: Record<string, any>): Promise<ToolResult> {
    const result = await this.client.callTool({
      name,
      arguments: args,
    });
  
    return {
      content: result, // or result.output / result.data if needed
      isError: false, // Set based on your error detection logic
    };
  }
  async cleanup(): Promise<void> {
    await this.client.close();
  }
}