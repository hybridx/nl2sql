# NL2SQL Pipeline

The NL2SQL pipeline enables users to write queries in plain English. An AI model then converts these queries into SQL, fetches data from a database, and generates an analysis.

## Prerequisites

- **Ollama**
  - `qwq:32b`
  - `nomic-embed-text`
- **Podman**
- **Node.js** (LTS version recommended)
- **npm**

## Backend Setup

### 1. Setting Up Virtual Environment

```sh
python3 -m venv ~/.venvs/aienv
source ~/.venvs/aienv/bin/activate
```

### 2. Install Dependencies

```sh
pip install -r backend/requirements.txt
```

### 3. Set Up PostgreSQL with pgvector

```sh
podman build -t pgvector-db .
podman run --name pgvector -p 5432:5432 \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=nl2sql \
  -d pgvector-db

podman exec -it pgvector psql -U admin -d nl2sql
```

### 4. Enable Vector Extension in PostgreSQL

```sql
CREATE EXTENSION IF NOT EXISTS vector;
SELECT version();
```

### 5. Extract Schema Information

```sh
python backend/schema_extractor.py
```

### 6. Verify Schema Embeddings Table

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'schema_embeddings';
```

✅ Expected output:

```sh
column_name    |  data_type
---------------+--------------
table_name     | text
schema_details | text
embedding      | USER-DEFINED
```

### 7. Run the Backend Application

```sh
cd backend
uvicorn main:app --reload
```

## Frontend Setup

### 1. Navigate to the Project Directory

```sh
cd frontend
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Start the Development Server

```sh
npm start
```

### 4. Build for Production

```sh
npm run build
```

### 5. Additional Commands

- `npm test` - Run tests
- `npm run lint` - Check for linting issues
- `npm run eject` - Eject the create-react-app configuration (if applicable)

## Features

- **Natural Language Input**: Write queries in plain English.
- **AI Conversion**: The AI model translates natural language queries into SQL.
- **Data Fetching**: The generated SQL queries fetch data from the database.
- **Analysis Generation**: The fetched data is analyzed and presented.

## Usage

1. **Input Query**: Enter your query in plain English.
2. **AI Processing**: The AI model processes the query and converts it into SQL.
3. **Data Retrieval**: The SQL query is executed on the database to retrieve the data.
4. **Analysis Output**: The retrieved data is analyzed and the results are displayed.

## Example

- **Input**: "Show me the total sales for the last quarter."
- **Output**: SQL query to fetch the total sales data for the last quarter, along with the resulting analysis.

## Requirements

- A database with relevant data.
- An AI model capable of converting natural language to SQL.

## Installation

To install the NL2SQL pipeline, follow these steps:

1. Clone the repository.
2. Install the required dependencies.
3. Configure the database connection.

## License

This project is licensed under the Apache License. See the [LICENSE](LICENSE) file for details.

Happy coding! 🚀
