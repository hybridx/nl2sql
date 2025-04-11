from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
import mysql.connector
import requests
import re
import json
from config import DB_CONFIG, PG_CONFIG
import schema_extractor  # Runs automatically on import
import psycopg2
import numpy as np

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

# Model configurations
EMBEDDING_MODEL = "mxbai-embed-large:latest"
AI_MODEL_ANALYSIS = "llama3.2:3b"
AI_MODEL_CONVERSATION = "mistral:7b"
AI_MODEL_SQL = 'granite-code:8b'
OLLAMA_EMBEDDINGS_URL = "http://localhost:11434/api/embeddings"
OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"

# MCP-related classes
class Message(BaseModel):
    role: str
    content: str

class ToolCall(BaseModel):
    tool_name: str
    tool_input: Dict[str, Any]

class ToolResult(BaseModel):
    tool_name: str
    tool_output: Any

class MCPRequest(BaseModel):
    messages: List[Message]
    tools: Optional[List[Dict[str, Any]]] = None
    tool_results: Optional[List[ToolResult]] = None

class MCPResponse(BaseModel):
    message: Message
    tool_calls: Optional[List[ToolCall]] = None

# Original request model
class QueryRequest(BaseModel):
    user_input: str
    store_in_vector_db: bool = False
    analysis: bool = False

# Tool schemas
nl2sql_tool = {
    "name": "nl2sql",
    "description": "Converts natural language queries into SQL and executes them against the database",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Natural language query about the database"
            },
            "store_in_vector_db": {
                "type": "boolean",
                "description": "Whether to store results in vector database"
            },
            "analysis": {
                "type": "boolean",
                "description": "Whether to generate analysis of the results"
            }
        },
        "required": ["query"]
    }
}

schema_info_tool = {
    "name": "get_schema_info",
    "description": "Retrieves database schema information",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

# Tool implementations
def get_embedding(text: str):
    """Generate embeddings using Ollama."""
    response = requests.post(OLLAMA_EMBEDDINGS_URL, json={"model": EMBEDDING_MODEL, "prompt": f"{text}"})
    return np.array(response.json()["embedding"]).tolist()

def store_embeddings_in_pgvector(text: str):
    """Store text embeddings in pgvector."""
    embedding = get_embedding(text)
    try:
        conn = psycopg2.connect(**PG_CONFIG)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO vector_store (content, embedding) VALUES (%s, %s)",
            (text, embedding)
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success", "message": "Embedding stored"}
    
    except Exception as e:
        return {"error": f"Failed to store embedding: {e}"}

def generate_analysis(data):
    """Converts raw SQL results into human-readable insights."""
    response = requests.post(
        OLLAMA_GENERATE_URL,
        json={"model": AI_MODEL_ANALYSIS, "prompt": f"Summarize the following data: {data}", "stream": False}
    )
    return response.json().get("response", "").strip()

def test_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")  # Test query
        result = cursor.fetchone()
        conn.close()
        return result is not None
    except Exception as e:
        return str(e)
    
def fetch_table_data(table_name: str):
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)  # Return results as a dictionary
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 10")  # Fetch first 10 rows
        result = cursor.fetchall()
        conn.close()
        return result
    except Exception as e:
        return {"error": str(e)}

def extract_clean_sql(llm_response: str) -> str:
    """
    Extracts clean SQL code from LLM response by removing markdown code blocks,
    explanatory text, newlines, and other artifacts. Returns SQL in lowercase.
    """
    # Look for SQL code between markdown code blocks
    sql_pattern = re.compile(r"```(?:sql)?\n(.*?)(?:\n)?```", re.DOTALL)
    matches = sql_pattern.findall(llm_response)
    
    if matches:
        # Get the first SQL code block found, clean it up
        sql = matches[0].strip()
        # Remove all newlines and convert to lowercase
        sql = re.sub(r'\s+', ' ', sql).lower()
        return sql.strip()
    
    # Fallback: try to find any SQL-like statement if no code blocks found
    # Look for lines that start with common SQL commands
    lines = llm_response.split('\n')
    for line in lines:
        line = line.strip()
        if re.match(r"^(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|USE)\s", line, re.IGNORECASE):
            # Remove all newlines and convert to lowercase
            return re.sub(r'\s+', ' ', line).lower().strip()
    
    # If no SQL found, return the entire response cleaned up
    clean_text = re.sub(r"```.*?```", "", llm_response, flags=re.DOTALL)
    # Remove all newlines and convert to lowercase
    clean_text = re.sub(r'\s+', ' ', clean_text).lower()
    return clean_text.strip()

def generate_embedding(text):
    """Get embedding using Ollama."""
    ollama_url = OLLAMA_EMBEDDINGS_URL
    payload = {"model": EMBEDDING_MODEL, "prompt": text}
    
    try:
        response = requests.post(ollama_url, json=payload)
        response.raise_for_status()
        embedding = response.json().get("embedding", [])
        return embedding
    except Exception as e:
        return str(e)

def get_relevant_schema_info(user_input: str):
    """Fetches the most relevant schema details using vector similarity search."""
    try:
        conn = psycopg2.connect(**PG_CONFIG)
        cursor = conn.cursor()

        # Generate the embedding (list of floats)
        embedding = generate_embedding(user_input)

        if not embedding:
            return "Error: Failed to generate query embedding"

        # Convert to PostgreSQL vector format
        embedding_vector = "[" + ",".join(map(str, embedding)) + "]"

        # Similarity search query
        cursor.execute("""
            SELECT table_name, schema_details
            FROM schema_embeddings
            ORDER BY embedding <-> %s::vector
            LIMIT 5;
        """, (embedding_vector,))

        schema_info = cursor.fetchall()
        cursor.close()
        conn.close()

        schema_text = "\n".join([f"Table: {row[0]} - {row[1]}" for row in schema_info])
        return schema_text

    except Exception as e:
        return f"Error fetching schema: {e}"

def generate_sql_from_nl(user_input: str):
    """
    Converts natural language to SQL using Ollama, with schema context.
    """
    schema_context = get_relevant_schema_info(user_input)
    if "Error" in schema_context:
        return schema_context

    prompt = f"""
### Instructions:
Convert the question into SQL using the database schema.
- **User Question:** {user_input}
- **Database Schema:** {schema_context}

Rules:
- Ensure the SQL query is correct.
- Use the correct SQL syntax.
- Return the SQL inside ```sql ``` blocks.
"""
    payload = {
        "model": AI_MODEL_SQL,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_GENERATE_URL, json=payload)
        response.raise_for_status()
        raw_response = response.json().get("response", "").strip()
        clean_sql = extract_clean_sql(raw_response)
        return clean_sql
    except Exception as e:
        return str(e)

def execute_sql_query(sql_query: str, store_in_vector_db=False, analysis=False):
    """Executes SQL, optionally stores results in pgvector, and generates analysis."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql_query)
        result = cursor.fetchall()
        conn.close()

        output = {"sql": sql_query, "data": result}

        if analysis:
            output["analysis"] = generate_analysis(result)

        if store_in_vector_db:
            store_embeddings_in_pgvector(str(result))

        return output

    except Exception as e:
        return {"error": str(e)}

def fetch_schema_info():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # Get all tables
        cursor.execute("SHOW TABLES")
        tables = [row[f"Tables_in_{DB_CONFIG['database']}"] for row in cursor.fetchall()]

        schema_info = {}

        for table in tables:
            cursor.execute(f"DESCRIBE {table}")
            columns = cursor.fetchall()
            schema_info[table] = [{"name": col["Field"], "type": col["Type"]} for col in columns]

        conn.close()
        return schema_info
    except Exception as e:
        return {"error": str(e)}

def run_nl2sql_tool(tool_input):
    query = tool_input.get("query")
    store_in_vector_db = tool_input.get("store_in_vector_db", False)
    analysis = tool_input.get("analysis", False)
    
    sql_query = generate_sql_from_nl(query)
    if isinstance(sql_query, dict) and "error" in sql_query:
        return {"error": sql_query["error"]}
    
    result = execute_sql_query(sql_query, store_in_vector_db, analysis)
    return result

def get_schema_info_tool(tool_input):
    schema_data = fetch_schema_info()
    return {"schema": schema_data}

# Function to process LLM requests and generate responses
def generate_conversation_response(messages):
    # Convert messages to the format expected by Ollama
    formatted_messages = []
    for msg in messages:
        if msg.role == "system":
            system_content = msg.content
        else:
            formatted_messages.append({"role": msg.role, "content": msg.content})
    
    # Prepare conversation context
    conversation_history = "\n".join([f"{msg['role']}: {msg['content']}" for msg in formatted_messages])
    
    # Prepare prompt with system instructions
    system_prompt = """You are a helpful assistant with access to a database.
You can answer general questions, and when users ask about data, you can use the nl2sql tool to query the database.
Only use the nl2sql tool when the user explicitly asks for data or information that would require querying a database.
When a user asks about the database structure, use the get_schema_info tool."""

    prompt = f"{system_prompt}\n\nConversation:\n{conversation_history}\n\nassistant:"
    
    # Generate response using Ollama
    response = requests.post(
        OLLAMA_GENERATE_URL,
        json={"model": AI_MODEL_CONVERSATION, "prompt": prompt, "stream": False}
    )
    
    return response.json().get("response", "").strip()

# Function to detect tool usage intent from assistant's response
def detect_tool_calls(response_text):
    tool_calls = []
    
    # Look for nl2sql tool usage intent
    nl2sql_pattern = re.compile(r"I'll use the nl2sql tool to query the database[.\s]*Query:(.*?)(?=\n\n|$)", re.DOTALL | re.IGNORECASE)
    schema_pattern = re.compile(r"I'll use the get_schema_info tool to retrieve the database schema", re.IGNORECASE)
    
    # Check for nl2sql tool usage
    nl2sql_matches = nl2sql_pattern.findall(response_text)
    if nl2sql_matches:
        for query in nl2sql_matches:
            query = query.strip()
            tool_calls.append(ToolCall(
                tool_name="nl2sql",
                tool_input={"query": query}
            ))
    
    # Check for schema info tool usage
    if schema_pattern.search(response_text):
        tool_calls.append(ToolCall(
            tool_name="get_schema_info",
            tool_input={}
        ))
    
    return tool_calls

# MCP endpoint
@app.post("/mcp")
async def mcp_endpoint(request: MCPRequest):
    # First, process any tool results that need to be incorporated into the conversation
    if request.tool_results:
        for tool_result in request.tool_results:
            # Create a system message with the tool result
            tool_message = Message(
                role="system",
                content=f"Tool '{tool_result.tool_name}' returned: {json.dumps(tool_result.tool_output, indent=2)}"
            )
            request.messages.append(tool_message)
    
    # Generate a response based on the conversation
    response_text = generate_conversation_response(request.messages)
    
    # Check if the response contains any tool usage intentions
    tool_calls = detect_tool_calls(response_text)
    
    # Create the response object
    response = MCPResponse(
        message=Message(role="assistant", content=response_text),
        tool_calls=tool_calls if tool_calls else None
    )
    
    return response

# Tool execution endpoint
@app.post("/execute_tool")
async def execute_tool(tool_call: ToolCall):
    if tool_call.tool_name == "nl2sql":
        result = run_nl2sql_tool(tool_call.tool_input)
    elif tool_call.tool_name == "get_schema_info":
        result = get_schema_info_tool(tool_call.tool_input)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown tool: {tool_call.tool_name}")
    
    return ToolResult(tool_name=tool_call.tool_name, tool_output=result)

# Tool discovery endpoint
@app.get("/tools")
async def get_tools():
    return {
        "tools": [
            nl2sql_tool,
            schema_info_tool
        ]
    }

# Keep original endpoints for backward compatibility
@app.get("/schema")
async def get_schema():
    schema_data = fetch_schema_info()
    return {"schema": schema_data}

@app.get("/db-check")
async def db_check():
    status = test_db_connection()
    return {"db_connected": status}

@app.get("/fetch/{table_name}")
async def get_table_data(table_name: str):
    data = fetch_table_data(table_name)
    return {"table": table_name, "data": data}

@app.post("/query")
async def process_query(request: QueryRequest):
    sql_query = generate_sql_from_nl(request.user_input)
    if isinstance(sql_query, dict) and "error" in sql_query:
        return {"error": sql_query["error"]}
    
    return execute_sql_query(sql_query, request.store_in_vector_db, request.analysis)

# Startup event handler
@app.on_event("startup")
async def startup():
    # Load any necessary resources or check connections
    db_status = test_db_connection()
    print(f"Database connection status: {db_status}")