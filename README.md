# Natural Language to SQL (NL2SQL) Pipeline

The NL2SQL pipeline allows users to write queries in plain English. An AI model then converts these queries into SQL, fetches data from a database, and generates an analysis.


```sh
python3 -m venv ~/.venvs/aienv                                                                                                                                 aienv
source ~/.venvs/aienv/bin/activate

podman build -t pgvector-db .
podman run --name pgvector -p 5432:5432 -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=nl2sql -d pgvector-db

CREATE EXTENSION IF NOT EXISTS vector;

podman exec -it pgvector psql -U admin -d nl2sql
SELECT version();

```
## Features
- **Natural Language Input**: Write queries in plain English.
- **AI Conversion**: An AI model translates the natural language queries into SQL.
- **Data Fetching**: The generated SQL queries fetch data from the database.
- **Analysis Generation**: The fetched data is used to generate an analysis.

## Usage
1. **Input Query**: Enter your query in plain English.
2. **AI Processing**: The AI model processes the query and converts it into SQL.
3. **Data Retrieval**: The SQL query is executed on the database to retrieve the data.
4. **Analysis Output**: The retrieved data is analyzed and the results are presented.

## Example
- **Input**: "Show me the total sales for the last quarter."
- **Output**: SQL query to fetch the total sales data for the last quarter and the resulting analysis.

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