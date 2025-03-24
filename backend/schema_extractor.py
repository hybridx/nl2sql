import psycopg2
import mysql.connector
import json
from config import DB_CONFIG, PG_CONFIG
import requests

OLLAMA_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = "nomic-embed-text"

def get_db_schema():
    """Fetch table structure from MariaDB."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Get all table names
        cursor.execute("SHOW TABLES;")
        tables = [row[0] for row in cursor.fetchall()]

        schema_info = {}

        for table in tables:
            cursor.execute(f"DESCRIBE {table};")
            columns = cursor.fetchall()

            schema_info[table] = [
                {
                    "name": col[0],   # Column name
                    "type": col[1],   # Data type
                    "key": col[3]     # PRIMARY KEY, FOREIGN KEY, etc.
                }
                for col in columns
            ]

        conn.close()
        return schema_info
    except Exception as e:
        print("Error fetching schema:", e)
        return None

def generate_embedding(text):
    """Generate embedding using Ollama."""
    payload = {
        "model": EMBED_MODEL,
        "prompt": text
    }
    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        return response.json()["embedding"]
    except Exception as e:
        print("Error generating embedding:", e)
        return None

def store_embeddings(schema_info):
    """Store schema embeddings in pgvector."""
    try:
        conn = psycopg2.connect(**PG_CONFIG)
        cursor = conn.cursor()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS schema_embeddings (
            table_name TEXT PRIMARY KEY,
            schema_details TEXT,      
            embedding VECTOR(768)
        );
        """)

        for table, columns in schema_info.items():
            schema_text = f"Table `{table}` Columns: " + ", ".join([f"{col['name']} ({col['type']}) {col['key']}" for col in columns])
            embedding = generate_embedding(schema_text)

            if embedding:
                cursor.execute("""
                    INSERT INTO schema_embeddings (table_name, schema_details, embedding)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (table_name) DO UPDATE 
                    SET schema_details = EXCLUDED.schema_details, embedding = EXCLUDED.embedding;
                """, (table, schema_text, json.dumps(embedding)))

        conn.commit()
        conn.close()
        print("✅ Schema embeddings stored successfully!")

    except Exception as e:
        print("❌ Error storing embeddings:", e)

if __name__ == "__main__":
    schema_info = get_db_schema()
    if schema_info:
        store_embeddings(schema_info)
