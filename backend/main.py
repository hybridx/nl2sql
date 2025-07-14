# proxy_client.py
import asyncio
from fastapi import FastAPI
from pydantic import BaseModel
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:8000/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NLQuery(BaseModel):
    question: str

@app.post("/query")
async def ask_mcp(nl: NLQuery):
    server_params = StdioServerParameters(command="python", args=["mcp_server.py"])
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool("ask_question", {"nl_query": nl.question})
            return {"data": result}
