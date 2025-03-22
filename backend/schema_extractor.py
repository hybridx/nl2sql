import psycopg2
import mysql.connector
import requests
import json
from config import DB_CONFIG, PG_CONFIG

# Ollama embedding model
OLLAMA_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = "nomic-embed-text"

# Function to fetch schema from MariaDB
def get_db_schema():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Fetch all tables
        cursor.execute("SHOW TABLES;")
        tables = [row[0] for row in cursor.fetchall()]
        
        schema_info = {}
        
        for table in tables:
            cursor.execute(f"DESCRIBE {table};")
            schema_info[table] = cursor.fetchall()
        
        conn.close()
        return schema_info
    except Exception as e:
        print("Error fetching schema:", e)
        return None

# Function to generate embeddings
def generate_embedding(text):
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

# Store embeddings in pgvector
def store_embeddings(schema_info):
    try:
        conn = psycopg2.connect(**PG_CONFIG)
        cursor = conn.cursor()
        
        # ✅ Create table for embeddings (with schema_details)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS schema_embeddings (
            table_name TEXT PRIMARY KEY,
            schema_details TEXT,       -- ✅ New column to store table schema
            embedding VECTOR(768)      -- Assuming 768 dimensions for embedding
        );
        """)

        for table, columns in schema_info.items():
            schema_text = f"Table {table} has columns: " + ", ".join([col[0] for col in columns])
            embedding = generate_embedding(schema_text)

            if embedding:
                # ✅ Insert or update schema details and embeddings
                cursor.execute("""
                    INSERT INTO schema_embeddings (table_name, schema_details, embedding)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (table_name) DO UPDATE 
                    SET schema_details = EXCLUDED.schema_details, embedding = EXCLUDED.embedding;
                """, (table, schema_text, json.dumps(embedding)))

        conn.commit()
        conn.close()
        print("✅ Embeddings stored successfully!")

    except Exception as e:
        print("❌ Error storing embeddings:", e)

# Run the schema extraction & embedding process
if __name__ == "__main__":
    schema_info = get_db_schema()
    if schema_info:
        store_embeddings(schema_info)
