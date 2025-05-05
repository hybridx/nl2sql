import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fetch from 'node-fetch';

interface Lab {
  id: string;
  name: string;
  description: string;
  url: string;
  lang: string;
}

const GRAPHQL_ENDPOINT = 'https://graphql.redhat.com';

const GET_LABS_QUERY = `
  query GetLabs {
    product_experience_apps(filter: { lang: "en" }, first: 100) {
      edges {
        node {
          id
          name
          description
          url
          lang
        }
      }
    }
  }
`;

async function fetchLabsFromGraphQL(): Promise<Lab[]> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apollographql-client-name': 'cp-labs-cvechecker',
      'apollographql-client-version': '2.2.0',
    },
    body: JSON.stringify({ query: GET_LABS_QUERY }),
  });

  const json = (await response.json()) as {
    data: {
      product_experience_apps: {
        edges: {
          node: Lab;
        }[];
      };
    };
  };

  if (!json.data || !json.data.product_experience_apps) {
    throw new Error('Unexpected GraphQL response');
  }

  return json.data.product_experience_apps.edges.map((edge) => edge.node);
}

let cachedLabsData: Lab[] | null = null;

async function loadLabData(): Promise<Lab[]> {
  if (!cachedLabsData) {
    cachedLabsData = await fetchLabsFromGraphQL();
  }
  return cachedLabsData;
}

function findMatchingLab(query: string, labs: Lab[]): Lab | null {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/).filter((word) => word.length > 2);

  const scoredLabs = labs.map((lab) => {
    const nameLower = lab.name.toLowerCase();
    const descLower = lab.description.toLowerCase();
    const idLower = lab.id.toLowerCase();

    let score = 0;
    for (const word of words) {
      if (nameLower.includes(word)) score += 2;
      if (descLower.includes(word)) score += 1;
      if (idLower.includes(word)) score += 1.5;
    }

    return { ...lab, score };
  });

  scoredLabs.sort((a, b) => b.score - a.score);
  return scoredLabs[0]?.score > 0 ? scoredLabs[0] : null;
}

const server = new McpServer({
  name: 'lab-finder',
  version: '1.0.0',
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  'find-lab',
  'Get recommendations for Red Hat labs, tools, or guides based on user questions',
  {
    query: z
      .string()
      .describe("A user's natural language request for Red Hat resources"),
  },
  async ({ query }) => {
    const labs = await loadLabData();

    if (!labs.length) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to load lab data.',
          },
        ],
      };
    }

    const matchedLab = findMatchingLab(query, labs);

    if (!matchedLab) {
      return {
        content: [
          {
            type: 'text',
            text: 'No matching resources found. Try rephrasing or asking about a different topic.',
          },
        ],
      };
    }

    const responseText = [
      `Here's something that might help you:\n`,
      `**Name**: ${matchedLab.name}`,
      `**Description**: ${matchedLab.description}`,
      `**URL**: ${matchedLab.url}`,
    ].join('\n');

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Lab Finder MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
