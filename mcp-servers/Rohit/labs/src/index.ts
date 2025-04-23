import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Define interfaces for lab data
interface Lab {
  id: string;
  url: string;
  name: string;
  description: string;
}

// Create server instance
const server = new McpServer({
  name: "lab-finder",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Path to the JSON file containing lab data
const DATA_FILE_PATH = path.join(__dirname, "../src/data/data.json");

/**
 * Load lab data from the JSON file
 */
function loadLabData(): Lab[] {
  try {
    const data = fs.readFileSync(DATA_FILE_PATH, "utf8");
    return JSON.parse(data) as Lab[];
  } catch (error) {
    console.error("Error reading lab data:", error);
    return [];
  }
}

/**
 * Find the best matching lab for a user query
 */
function findMatchingLab(query: string, labs: Lab[]): Lab | null {
  if (!labs || labs.length === 0) {
    return null;
  }

  const queryLower = query.toLowerCase();

  const matchedLabs = labs.map((lab) => {
    const descLower = lab.description.toLowerCase();
    const nameLower = lab.name.toLowerCase();
    const idLower = lab.id.toLowerCase();

    // Calculate a score based on keyword matches
    const words = queryLower.split(/\s+/).filter((word) => word.length > 2);

    let score = 0;
    for (const word of words) {
      // Weight matches in name higher than in description
      if (nameLower.includes(word)) {
        score += 2;
      }
      if (descLower.includes(word)) {
        score += 1;
      }
      if (idLower.includes(word)) {
        score += 1.5;
      }
    }

    return {
      ...lab,
      score,
    };
  });

  // Sort by score
  matchedLabs.sort((a, b) => b.score - a.score);

  // Return the best match if it has some relevance
  if (matchedLabs[0].score > 0) {
    return matchedLabs[0];
  }

  return null;
}

// Register lab finder tool
server.tool(
  "find-lab",
  "Find a lab based on user requirements or problem to solve",
  {
    query: z
      .string()
      .describe("User's description of what they want to do or learn"),
  },
  async ({ query }) => {
    // Load labs data
    const labs = loadLabData();

    if (!labs || labs.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to load lab data. Please check if the labs.json file exists and is properly formatted.",
          },
        ],
      };
    }

    // Find the best matching lab
    const matchedLab = findMatchingLab(query, labs);

    if (!matchedLab) {
      return {
        content: [
          {
            type: "text",
            text: "No matching labs found for your query. Please try a different description of what you're looking to learn or accomplish.",
          },
        ],
      };
    }

    // Format the response
    const responseText = [
      `I found a lab that matches your requirements:`,
      ``,
      `Name: ${matchedLab.name}`,
      `Description: ${matchedLab.description}`,
      ``,
      `You can access this lab at: ${matchedLab.url}`,
    ].join("\n");

    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lab Finder MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
