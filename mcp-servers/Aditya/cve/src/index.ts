import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create MCP Server instance
const server = new McpServer({
  name: "cve",
  version: "1.0.0",
  capabilities: {
    resources: {},
  },
});

async function fetchCveData(cveId: string): Promise<any | null> {
  const match = cveId.match(/^CVE-(\d{4})-(\d+)$/i);
  if (!match) {
    console.error("Invalid CVE ID format");
    return null;
  }

  const [, year, number] = match;
  const url = `https://security.access.redhat.com/data/csaf/v2/vex/${year}/cve-${year}-${number}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`Failed to fetch CVE data:`, err);
    return null;
  }
}

server.tool(
  "summarize-cve",
  "Fetch and summarize a CVE from Red Hat's CSAF feed",
  {
    cveId: z.string().describe("The CVE ID to summarize (e.g. CVE-2024-53907)"),
  },
  async ({ cveId }) => {
    const data = await fetchCveData(cveId);
    if (!data) {
      return {
        content: [{ type: "text", text: `Could not retrieve data for ${cveId}` }],
      };
    }

    const title = data?.document?.title || "No title available";
    const notes = data?.document?.notes?.map((n: any) => n.text).join("\n\n") || "No additional notes found.";
    const trackingId = data?.document?.tracking?.id || cveId;

    const severity = data?.vulnerabilities?.[0]?.scores?.[0]?.cvss_v3?.baseSeverity || "Unknown";

    const productBranches = data?.product_tree?.branches || [];
    const affectedProducts = productBranches
      .map((branch: any) => {
        const subBranches = branch.branches || [];
        return [branch.name, ...subBranches.map((sb: any) => sb.name)].filter(Boolean);
      })
      .flat()
      .filter(Boolean);

    const affectedList = affectedProducts.length
      ? affectedProducts.map((p: string) => `- ${p}`).join("\n")
      : "No affected products listed.";

    const references = data?.vulnerabilities?.[0]?.references?.map((ref: any) => `- [${ref.url}](${ref.url})`) || [];
    const referencesText = references.length ? references.join("\n") : "No references available.";

    return {
      content: [
        {
          type: "text",
          text: `###  ${title}\n\n**Tracking ID:** ${trackingId}\n**Severity:** ${severity}\n\n---\n\n###  Notes\n${notes}\n\n---\n\n###  Affected Products\n${affectedList}\n\n---\n\n### 🔗 References\n${referencesText}`,
        },
      ],
    };
  }
);

server.tool(
  "get-cve-summary-html",
  "Returns a rich HTML card-style summary for a CVE with severity, products, links, and remediation info",
  {
    cveId: z.string().describe("The CVE ID to summarize (e.g. CVE-2024-53907)"),
  },
  async ({ cveId }) => {
    const data = await fetchCveData(cveId);
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `Could not retrieve data for ${cveId}`,
          },
        ],
        isError: true,
      };
    }

    const title = data?.document?.title || "No title available";
    const severity = data?.vulnerabilities?.[0]?.scores?.[0]?.cvss_v3?.baseSeverity || "Unknown";

    const remediationNotes =
      data?.document?.notes
        ?.filter((n: any) => n.category === "remediation")
        .map((n: any) => n.text)
        .join("<br/>") || "No remediation steps available.";

    const productBranches = data?.product_tree?.branches || [];
    const affectedProducts = productBranches
      .map((branch: any) => {
        const subBranches = branch.branches || [];
        return [branch.name, ...subBranches.map((sb: any) => sb.name)].filter(Boolean);
      })
      .flat()
      .filter(Boolean);

    const references = data?.vulnerabilities?.[0]?.references || [];

    const html = `
      <div style="background-color: #f5f3f4; border: 1px solid #ccc; border-radius: 8px; padding: 16px; max-width: 600px; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.1)">
        <h2 style="margin-top: 0;">${title}</h2>
        <span style="display: inline-block; padding: 4px 10px; background-color: ${
          severity === "Critical"
            ? "#a30000"
            : severity === "Important"
            ? "#b85c00"
            : severity === "Moderated"
            ? "#f5c12e"
            : severity === "Low"
            ? "#316dc1"
            : "#90a4ae"
        }; color: white; border-radius: 4px; font-size: 14px;">${severity}</span>

        <h4 style="margin-top: 20px;">Affected Products:</h4>
        <ul>
          ${affectedProducts.length > 0 ? affectedProducts.map((p: string) => `<li>${p}</li>`).join("") : "<li>None listed.</li>"}
        </ul>

        <h4 style="margin-top: 20px;">Remediation:</h4>
        <p>${remediationNotes}</p>

        <h4 style="margin-top: 20px;">References:</h4>
        <ul>
          ${references.length > 0
            ? references.map((ref: any) => `<li><a href="${ref.url}" target="_blank">${ref.url}</a></li>`).join("")
            : "<li>None listed.</li>"}
        </ul>
      </div>
    `;

    return {
      content: [
        {
          type: "resource",
          resource: {
            text: html,
            mimeType: "text/html",
            uri: "data:text/html;base64," + Buffer.from(html).toString("base64"),
          },
        },
      ],
      isError: false,
      _meta: {},
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CVE MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
