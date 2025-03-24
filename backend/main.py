from fastapi import FastAPI
from pydantic import BaseModel
import mysql.connector
import requests
import re  # Add this import for regex
from config import DB_CONFIG, PG_CONFIG
import schema_extractor  # Runs automatically on import
import psycopg2
import numpy as np

app = FastAPI()

EMBEDDING_MODEL = "nomic-embed-text"
AI_MODEL = "deepseek-r1:14b"
OLLAMA_EMBEDDINGS_URL = "http://localhost:11434/api/embeddings"
OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"

# Define request model
class QueryRequest(BaseModel):
    user_input: str
    store_in_vector_db: bool = False
    analysis: bool = False

def get_embedding(text: str):
    """Generate embeddings using Ollama."""
    response = requests.post(OLLAMA_EMBEDDINGS_URL, json={"model": EMBEDDING_MODEL, "prompt": "{text}"})
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
        json={"model": AI_MODEL, "prompt": f"Summarize the following data: {data}", "stream": False}
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
    """
    Fetches the most relevant schema details using vector similarity search.
    """
    try:
        conn = psycopg2.connect(**PG_CONFIG)
        cursor = conn.cursor()

        # Convert user query to an embedding (returns a list of floats)
        embedding = generate_embedding(user_input)

        # Convert embedding list to PostgreSQL vector format
        embedding_str = f"[{','.join(map(str, embedding))}]"  # Wrap in square brackets

        # Perform similarity search with explicit casting
        query = """
            SELECT table_name
            FROM schema_embeddings
            ORDER BY embedding <-> %s::vector
            LIMIT 3;
        """
        cursor.execute(query, (embedding_str,))  # Use safe parameterized query

        schema_info = cursor.fetchall()

        cursor.close()
        conn.close()

        # Format the retrieved schema
        schema_text = "\n".join([f"Table: {row[0]}" for row in schema_info])
        return schema_text

    except Exception as e:
        return f"Error fetching schema: {e}"

def generate_sql_from_nl(user_input: str):
    """
    Converts natural language to SQL using Ollama, with schema context.
    """
    schema_context = get_relevant_schema_info(user_input)
    print(schema_context)
    
    ollama_url = OLLAMA_GENERATE_URL

    prompt = f"""
### Instructions:
Your task is to convert a question into a SQL query, given a Mariadb database schema.
Adhere to these rules:
- **Deliberately go through the question `{user_input}`. and database schema {schema_context} word by word** to appropriately answer the question
- **Ensure that the SQL query is correct and relevant to the question**
- **Use the correct SQL syntax and keywords**
- **Do not include any irrelevant information**
- **Do not include any personal opinions or comments**
- **Do not include any SQL comments**
- **Keep the SQL query concise and to the point and easy**
- **Reply sql inside ```sql ```**
"""
    payload = {
      "model": AI_MODEL,
      "prompt": prompt,
      "stream": False
    }
    print(payload)

    try:
        response = requests.post(ollama_url, json=payload)
        response.raise_for_status()
        raw_response = response.json().get("response", "").strip()
        print(raw_response)
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
            store_embeddings_in_pgvector(result)

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

# Endpoint to handle NL -> SQL -> Data pipeline
@app.post("/query")
async def process_query(request: QueryRequest):
    sql_query = generate_sql_from_nl(request.user_input)
    if "error" in sql_query:
        return {"error": sql_query}
    
    return execute_sql_query(sql_query, request.store_in_vector_db, request.analysis)