import psycopg2
import mysql.connector
import json
from config import DB_CONFIG, PG_CONFIG
import requests

OLLAMA_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = "mxbai-embed-large:latest" # 1024 if mxbai , 768 if nomic

def get_db_schema():
    """Fetch complete database schema metadata from MariaDB."""
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

            cursor.execute(f"SHOW CREATE TABLE {table};")
            create_table_stmt = cursor.fetchone()[1]

            cursor.execute(f"SELECT COUNT(*) FROM {table};")
            row_count = cursor.fetchone()[0]

            schema_info[table] = {
                "columns": [
                    {
                        "name": col[0],   # Column name
                        "type": col[1],   # Data type
                        "null": col[2],   # NULL or NOT NULL
                        "key": col[3],    # PRIMARY KEY, FOREIGN KEY, etc.
                        "default": col[4], # Default value
                        "extra": col[5]   # Extra info (e.g., auto_increment)
                    }
                    for col in columns
                ],
                "create_statement": create_table_stmt,
                "row_count": row_count,
                "relations": []
            }

        # Extract Foreign Key Relationships
        cursor.execute("""
            SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = %s AND REFERENCED_TABLE_NAME IS NOT NULL;
        """, (DB_CONFIG["database"],))
        
        for row in cursor.fetchall():
            table, column, ref_table, ref_column = row
            if table in schema_info:
                schema_info[table]["relations"].append({
                    "column": column,
                    "related_table": ref_table,
                    "related_column": ref_column
                })

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
            embedding VECTOR(1024)
        );
        """)

        for table, details in schema_info.items():
            schema_text = f"Table `{table}` Columns: " + ", ".join([f"{col['name']} ({col['type']}) {col['key']}" for col in details["columns"]])
            
            if details["relations"]:
                relations_text = ", ".join([f"{rel['column']} -> {rel['related_table']}.{rel['related_column']}" for rel in details["relations"]])
                schema_text += f". Relationships: {relations_text}"
            
            schema_text += f". Row Count: {details['row_count']}. CREATE Statement: {details['create_statement']}"
            
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
        print(json.dumps(schema_info, indent=2))
        store_embeddings(schema_info)