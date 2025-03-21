import psycopg2

PG_CONFIG = {
    "dbname": "nl2sql",
    "user": "admin",
    "password": "admin",
    "host": "localhost",
    "port": "5432",
}

def fetch_embeddings():
    try:
        conn = psycopg2.connect(**PG_CONFIG)
        cursor = conn.cursor()
        
        cursor.execute("SELECT table_name, embedding FROM schema_embeddings LIMIT 5;")
        rows = cursor.fetchall()
        
        for row in rows:
            print(f"Table: {row[0]}, Embedding: {row[1][:10]}...")  # Show a preview of the embedding
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error fetching embeddings: {e}")

if __name__ == "__main__":
    fetch_embeddings()
