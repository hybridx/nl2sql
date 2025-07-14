import dotenv from "dotenv";
dotenv.config();

export const config = {
  ollama: {
    apiUrl: process.env.OLLAMA_API_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2:3b"
  },
  mcp: {
    clientName: "mcp-client-cli",
    version: "1.0.0"
  }
};