import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
// Create server instance
const server = new McpServer({
    name: 'product-lifecycle-api',
    version: '1.0.0',
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Sample data - replace with your full dataset
const productData = [
    {
        uuid: "85d6fd30-4292-4293-9621-87040b383b04",
        name: ".NET",
        former_names: [".Net Core"],
        is_layered_product: false,
        versions: [
            {
                name: ".NET 9.0",
                type: "Full Support",
                additional_text: "",
                phases: [
                    {
                        name: "General availability",
                        date: "2024-11-12T00:00:00.000Z",
                        date_format: "date",
                        additional_text: ""
                    },
                    {
                        name: "Full support",
                        date: "2026-05-12T00:00:00.000Z",
                        date_format: "date",
                        additional_text: ""
                    },
                    {
                        name: "End of Life",
                        date: "2026-05-12T00:00:00.000Z",
                        date_format: "date",
                        additional_text: ""
                    }
                ],
                tier: "N/A",
                extra_dependences: []
            },
            {
                name: ".NET 8.0",
                type: "Full Support",
                additional_text: "",
                phases: [
                    {
                        name: "General availability",
                        date: "2023-11-14T00:00:00.000Z",
                        date_format: "date",
                        additional_text: ""
                    },
                    {
                        name: "Full support",
                        date: "2026-11-10T00:00:00.000Z",
                        date_format: "date",
                        additional_text: ""
                    },
                    {
                        name: "End of Life",
                        date: "2026-11-10T00:00:00.000Z",
                        date_format: "date",
                        additional_text: ""
                    }
                ],
                tier: "N/A",
                extra_dependences: []
            },
            {
                name: ".NET 7.0",
                type: "End of life",
                additional_text: "",
                phases: [
                    {
                        name: "General availability",
                        date: "2022-11-10T00:00:00.000Z",
                        date_format: "date",
                        additional_text: ""
                    },
                    {
                        name: "Full support",
                        date: "2024-05-14T00:00:00.000Z",
                        date_format: "date",
                        additional_text: ""
                    },
                    {
                        name: "End of Life",
                        date: "2024-05-14T00:00:00.000Z",
                        date_format: "date",
                        additional_text: ""
                    }
                ],
                tier: "N/A",
                extra_dependences: []
            }
            // Additional versions would be added here with the full dataset
        ],
        footnote: "",
        is_operator: false,
        link: "https://access.redhat.com/support/policy/updates/net-core"
    }
    // Additional products would be added here with the full dataset
];
// Helper function to load product data
function loadProductData() {
    return productData;
}
// Helper function to get product by name
function getProductByName(name) {
    const products = loadProductData();
    return products.find(p => p.name.toLowerCase() === name.toLowerCase() ||
        p.former_names.some(fn => fn.toLowerCase() === name.toLowerCase())) || null;
}
// Helper function to format dates nicely
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
// Helper function to determine product status based on dates
function getLifecycleStatus(version) {
    const now = new Date();
    // Find GA date
    const gaPhase = version.phases.find(p => p.name === "General availability");
    if (!gaPhase || new Date(gaPhase.date) > now) {
        return "Future Release";
    }
    // Find EOL date
    const eolPhase = version.phases.find(p => p.name === "End of Life");
    if (eolPhase && new Date(eolPhase.date) <= now) {
        return "End of Life";
    }
    // Find Full Support end date
    const fullSupportPhase = version.phases.find(p => p.name === "Full support");
    if (fullSupportPhase && new Date(fullSupportPhase.date) <= now) {
        return "Maintenance Support";
    }
    return "Full Support";
}
// Helper function to get time remaining in current phase
function getTimeRemaining(version) {
    const now = new Date();
    const status = getLifecycleStatus(version);
    if (status === "End of Life") {
        return "No support remaining";
    }
    if (status === "Future Release") {
        const gaPhase = version.phases.find(p => p.name === "General availability");
        if (gaPhase) {
            const gaDate = new Date(gaPhase.date);
            const daysUntilGA = Math.ceil((gaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return `${daysUntilGA} days until General Availability`;
        }
        return "Release date undetermined";
    }
    // For Full Support or Maintenance Support, calculate time to next phase
    const nextPhase = status === "Full Support"
        ? version.phases.find(p => p.name === "Full support")
        : version.phases.find(p => p.name === "End of Life");
    if (nextPhase) {
        const nextDate = new Date(nextPhase.date);
        const daysRemaining = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return `${daysRemaining} days remaining`;
    }
    return "Unknown";
}
// Register tool: Get all products
server.tool('get-all-products', 'Get a list of all available products', {}, async () => {
    const products = loadProductData();
    if (!products || products.length === 0) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'No product data available.',
                },
            ],
        };
    }
    const productNames = products.map(p => p.name).join(', ');
    return {
        content: [
            {
                type: 'text',
                text: `Available products: ${productNames}`,
            },
        ],
    };
});
// Register tool: Get product info by name
server.tool('get-product-info', 'Get detailed information about a specific product', {
    productName: z.string().describe('The name of the product to look up'),
}, async ({ productName }) => {
    const product = getProductByName(productName);
    if (!product) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Product "${productName}" not found. Please check the name and try again.`,
                },
            ],
        };
    }
    // Build the response text
    const responseLines = [
        `# ${product.name} Product Lifecycle Information`,
        '',
        product.former_names.length > 0 ? `Also known as: ${product.former_names.join(', ')}` : '',
        '',
        '## Versions',
        ''
    ];
    product.versions.forEach(version => {
        const status = getLifecycleStatus(version);
        const timeRemaining = getTimeRemaining(version);
        responseLines.push(`### ${version.name} (${status})`);
        responseLines.push('');
        version.phases.forEach(phase => {
            responseLines.push(`- **${phase.name}**: ${formatDate(phase.date)}`);
        });
        responseLines.push(`- **Current Status**: ${status}`);
        responseLines.push(`- **Time Remaining**: ${timeRemaining}`);
        responseLines.push('');
    });
    if (product.footnote) {
        responseLines.push(`**Note**: ${product.footnote}`);
        responseLines.push('');
    }
    if (product.link) {
        responseLines.push(`For more information, visit: ${product.link}`);
    }
    return {
        content: [
            {
                type: 'text',
                text: responseLines.join('\n'),
            },
        ],
    };
});
// Register tool: Find versions by support status
server.tool('find-versions-by-status', 'Find product versions with a specific support status', {
    productName: z.string().describe('The name of the product to look up'),
    status: z.enum(['Full Support', 'Maintenance Support', 'End of Life', 'Future Release'])
        .describe('The support status to filter by'),
}, async ({ productName, status }) => {
    const product = getProductByName(productName);
    if (!product) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Product "${productName}" not found. Please check the name and try again.`,
                },
            ],
        };
    }
    const matchingVersions = product.versions.filter(version => {
        const versionStatus = getLifecycleStatus(version);
        return versionStatus === status;
    });
    if (matchingVersions.length === 0) {
        return {
            content: [
                {
                    type: 'text',
                    text: `No versions of ${product.name} with status "${status}" found.`,
                },
            ],
        };
    }
    const responseLines = [
        `# ${product.name} Versions with Status: ${status}`,
        ''
    ];
    matchingVersions.forEach(version => {
        const timeRemaining = getTimeRemaining(version);
        responseLines.push(`## ${version.name}`);
        responseLines.push('');
        version.phases.forEach(phase => {
            responseLines.push(`- **${phase.name}**: ${formatDate(phase.date)}`);
        });
        responseLines.push(`- **Time Remaining**: ${timeRemaining}`);
        responseLines.push('');
    });
    return {
        content: [
            {
                type: 'text',
                text: responseLines.join('\n'),
            },
        ],
    };
});
// Register tool: Find versions expiring within time period
server.tool('find-expiring-versions', 'Find product versions expiring within a specified number of days', {
    productName: z.string().describe('The name of the product to look up'),
    days: z.number().describe('Number of days to look ahead for expiring versions'),
}, async ({ productName, days }) => {
    const product = getProductByName(productName);
    if (!product) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Product "${productName}" not found. Please check the name and try again.`,
                },
            ],
        };
    }
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const expiringVersions = product.versions.filter(version => {
        // Check if Full Support or End of Life phases are within the time window
        return version.phases.some(phase => {
            if (phase.name === "Full support" || phase.name === "End of Life") {
                const phaseDate = new Date(phase.date);
                return phaseDate > now && phaseDate <= futureDate;
            }
            return false;
        });
    });
    if (expiringVersions.length === 0) {
        return {
            content: [
                {
                    type: 'text',
                    text: `No versions of ${product.name} are expiring within the next ${days} days.`,
                },
            ],
        };
    }
    const responseLines = [
        `# ${product.name} Versions Expiring Within ${days} Days`,
        ''
    ];
    expiringVersions.forEach(version => {
        const status = getLifecycleStatus(version);
        responseLines.push(`## ${version.name} (Currently: ${status})`);
        responseLines.push('');
        version.phases.forEach(phase => {
            const phaseDate = new Date(phase.date);
            if (phaseDate > now && phaseDate <= futureDate) {
                const daysUntil = Math.ceil((phaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                responseLines.push(`- **${phase.name}**: ${formatDate(phase.date)} (in ${daysUntil} days)`);
            }
            else {
                responseLines.push(`- **${phase.name}**: ${formatDate(phase.date)}`);
            }
        });
        responseLines.push('');
    });
    return {
        content: [
            {
                type: 'text',
                text: responseLines.join('\n'),
            },
        ],
    };
});
async function main() {
    // Replace with your complete product data
    // productData = loadFullProductData();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Product Lifecycle MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
