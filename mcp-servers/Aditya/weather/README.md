# Weather MCP Server

A **Model Context Protocol (MCP)** server providing real-time weather data using the [National Weather Service (NWS) API](https://www.weather.gov/documentation/services-web-api) and sunrise/sunset information using the [Sunrise-Sunset API](https://sunrise-sunset.org/api).  
It exposes tools for retrieving weather alerts, forecasts, and solar data for any US-based location.

---

## 🛠 Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/weather-mcp-server.git
   cd nl2sql/mcp-servers/Aditya/weather
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the application:**

   ```bash
   node src/index.js
   ```

---

## 🖥 Using Claude Desktop

1. **Download Claude Desktop.**  
2. **Configure Claude Desktop for your MCP server:**

   Open the configuration file at:

   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

   *(Create the file if it doesn't exist.)*

3. **Add your server configuration:**

   ```json
   {
     "mcpServers": {
       "weather": {
         "command": "node",
         "args": [
           "/ABSOLUTE/PATH/TO/PARENT/FOLDER/weather/build/index.js"
         ]
       }
     }
   }
   ```

4. **Save the file and restart Claude for Desktop.**

---

### What this does:

- Registers an MCP server named `"weather"`.
- Tells Claude to launch it using the provided `node` command.
- Enables weather-related UI elements within Claude for Desktop.

---
