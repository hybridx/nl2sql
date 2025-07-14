# mcp_server.py
from mcp.server.fastmcp import FastMCP, Context
import psycopg2
import requests
from config import PG_CONFIG, DB_CONFIG
import re

mcp = FastMCP("DB Insight Server")

# === Helper: Generate embedding (reuse from your code) ===
def generate_embedding(text: str):
    payload = {"model": "mxbai-embed-large:latest", "prompt": text}
    response = requests.post("http://localhost:11434/api/embeddings", json=payload)
    return response.json()["embedding"]

# === Resource: Show all table schemas ===
@mcp.resource("schema://all")
def fetch_schema() -> str:
    conn = psycopg2.connect(**PG_CONFIG)
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    grouped = {}
    for table, column, dtype in rows:
        grouped.setdefault(table, []).append(f"{column} ({dtype})")
    return "\n".join([f"{t}: {', '.join(cols)}" for t, cols in grouped.items()])

# === Tool: Natural language to SQL and run it ===
@mcp.tool()
def ask_question(nl_query: str) -> str:
    embedding = generate_embedding(nl_query)
    conn = psycopg2.connect(**PG_CONFIG)
    cur = conn.cursor()

    # Find best matching table/schema info
    cur.execute("""
        SELECT schema_details 
        FROM schema_embeddings 
        ORDER BY embedding <-> %s::vector 
        LIMIT 1;
    """, [embedding])
    best_schema = cur.fetchone()[0]
    cur.close()
    conn.close()

    prompt = f"""
Convert the question to SQL.
- Question: {nl_query}
- Schema: {best_schema}

Respond with SQL inside ```sql```:
"""
    response = requests.post("http://localhost:11434/api/generate", json={
        "model": "granite-code:8b",
        "prompt": prompt,
        "stream": False
    })
    raw = response.json().get("response", "")
    match = re.search(r"```sql\s+(.*?)\s+```", raw, re.DOTALL)
    clean_sql = match.group(1) if match else raw

    # Run SQL
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute(clean_sql)
    rows = cur.fetchall()
    columns = [desc[0] for desc in cur.description]
    cur.close()
    conn.close()

    # Format result
    return "\n".join([str(dict(zip(columns, row))) for row in rows])

# === Prompt: Data summarizer ===
@mcp.prompt()
def summarize_table(table_name: str) -> str:
    return f"Summarize trends and insights from the `{table_name}` table. Focus on anomalies or key patterns."

if __name__ == "__main__":
    mcp.run()
