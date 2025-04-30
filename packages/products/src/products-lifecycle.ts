// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// import { z } from 'zod';
// import fetch from 'node-fetch';

// // Define interfaces for product lifecycle data
// interface ProductPhase {
//   name: string;
//   date: string;
//   date_format: string;
//   additional_text: string;
// }

// interface ProductVersion {
//   name: string;
//   type: string;
//   phases: ProductPhase[];
//   tier?: string;
//   openshift_compatibility?: any;
//   additional_text: string;
//   extra_dependences: any[];
// }

// interface Product {
//   uuid: string;
//   name: string;
//   former_names: string[];
//   versions: ProductVersion[];
//   is_layered_product: boolean;
//   footnote: string;
//   is_operator: boolean;
//   link?: string;
// }

// // API URLs for Red Hat Product Lifecycle
// const API_BASE_URL = 'https://access.redhat.com/product-life-cycles/api/v1';
// const PRODUCTS_LIST_URL = `${API_BASE_URL}/products`;

// // Create server instance
// const server = new McpServer({
//   name: 'red-hat-product-lifecycle-api',
//   version: '1.0.0',
//   capabilities: {
//     resources: {},
//     tools: {},
//   },
// });

// // Helper function to fetch products list
// async function fetchProductsList() {
//   try {
//     const response = await fetch(PRODUCTS_LIST_URL);
//     if (!response.ok) {
//       throw new Error(`API responded with status: ${response.status}`);
//     }
//     const data = await response.json();
//     return data.data || [];
//   } catch (error) {
//     console.error('Error fetching products list:', error);
//     return [];
//   }
// }

// // Helper function to fetch detailed product info by UUID
// async function fetchProductByUUID(uuid: string) {
//   try {
//     const response = await fetch(`${API_BASE_URL}/products/${uuid}`);
//     if (!response.ok) {
//       throw new Error(`API responded with status: ${response.status}`);
//     }
//     const data = await response.json();
//     return data.data || null;
//   } catch (error) {
//     console.error(`Error fetching product ${uuid}:`, error);
//     return null;
//   }
// }

// // Helper function to fetch product by name
// async function fetchProductByName(name: string) {
//   try {
//     // First get the list of products
//     const products = await fetchProductsList();
    
//     // Find the product that matches the name
//     const product = products.find((p: any) => 
//       p.name.toLowerCase() === name.toLowerCase() ||
//       (p.former_names && p.former_names.some((fn: string) => fn.toLowerCase() === name.toLowerCase()))
//     );
    
//     if (!product) {
//       return null;
//     }
    
//     // Fetch detailed product info using the UUID
//     return await fetchProductByUUID(product.uuid);
//   } catch (error) {
//     console.error(`Error fetching product by name ${name}:`, error);
//     return null;
//   }
// }

// // Helper function to format dates nicely
// function formatDate(dateString: string): string {
//   const date = new Date(dateString);
//   return date.toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric'
//   });
// }

// // Helper function to determine product status based on dates
// function getLifecycleStatus(version: ProductVersion): string {
//   const now = new Date();
  
//   // Find GA date
//   const gaPhase = version.phases.find(p => p.name === "General availability");
//   if (!gaPhase || new Date(gaPhase.date) > now) {
//     return "Future Release";
//   }
  
//   // Find EOL date
//   const eolPhase = version.phases.find(p => p.name === "End of Life");
//   if (eolPhase && new Date(eolPhase.date) <= now) {
//     return "End of Life";
//   }
  
//   // Find Full Support end date
//   const fullSupportPhase = version.phases.find(p => p.name === "Full support");
//   if (fullSupportPhase && new Date(fullSupportPhase.date) <= now) {
//     return "Maintenance Support";
//   }
  
//   return "Full Support";
// }

// // Helper function to get time remaining in current phase
// function getTimeRemaining(version: ProductVersion): string {
//   const now = new Date();
//   const status = getLifecycleStatus(version);
  
//   if (status === "End of Life") {
//     return "No support remaining";
//   }
  
//   if (status === "Future Release") {
//     const gaPhase = version.phases.find(p => p.name === "General availability");
//     if (gaPhase) {
//       const gaDate = new Date(gaPhase.date);
//       const daysUntilGA = Math.ceil((gaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
//       return `${daysUntilGA} days until General Availability`;
//     }
//     return "Release date undetermined";
//   }
  
//   // For Full Support or Maintenance Support, calculate time to next phase
//   const nextPhase = status === "Full Support" 
//     ? version.phases.find(p => p.name === "Full support")
//     : version.phases.find(p => p.name === "End of Life");
  
//   if (nextPhase) {
//     const nextDate = new Date(nextPhase.date);
//     const daysRemaining = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
//     return `${daysRemaining} days remaining`;
//   }
  
//   return "Unknown";
// }

// // Register tool: Get all products
// server.tool(
//   'get-all-products',
//   'Get a list of all available Red Hat products',
//   {},
//   async () => {
//     const products = await fetchProductsList();
    
//     if (!products || products.length === 0) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: 'No product data available or error connecting to Red Hat Product Lifecycle API.',
//           },
//         ],
//       };
//     }
    
//     // Format the product list in a readable way
//     const responseLines = [
//       '# Available Red Hat Products',
//       '',
//     ];
    
//     // Group products by category or alphabetically
//     const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));
    
//     sortedProducts.forEach((product: any) => {
//       responseLines.push(`- **${product.name}** (${product.uuid})`);
//     });
    
//     return {
//       content: [
//         {
//           type: 'text',
//           text: responseLines.join('\n'),
//         },
//       ],
//     };
//   }
// );

// // Register tool: Search products
// server.tool(
//   'search-products',
//   'Search for Red Hat products by name',
//   {
//     query: z.string().describe('The search query (product name)'),
//   },
//   async ({ query }) => {
//     const products = await fetchProductsList();
    
//     if (!products || products.length === 0) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: 'No product data available or error connecting to Red Hat Product Lifecycle API.',
//           },
//         ],
//       };
//     }
    
//     const queryLower = query.toLowerCase();
    
//     // Find matching products
//     const matchingProducts = products.filter((product: any) => {
//       // Check in main name
//       if (product.name.toLowerCase().includes(queryLower)) {
//         return true;
//       }
      
//       // Check in former names if available
//       if (product.former_names && Array.isArray(product.former_names)) {
//         return product.former_names.some((name: string) => 
//           name.toLowerCase().includes(queryLower)
//         );
//       }
      
//       return false;
//     });
    
//     if (matchingProducts.length === 0) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: `No products found matching "${query}". Try a different search term.`,
//           },
//         ],
//       };
//     }
    
//     // Format the results
//     const responseLines = [
//       `# Search Results for "${query}"`,
//       '',
//       `Found ${matchingProducts.length} product${matchingProducts.length === 1 ? '' : 's'}:`,
//       '',
//     ];
    
//     matchingProducts.forEach((product: any) => {
//       responseLines.push(`## ${product.name}`);
//       if (product.former_names && product.former_names.length > 0) {
//         responseLines.push(`Also known as: ${product.former_names.join(', ')}`);
//       }
//       responseLines.push(`UUID: ${product.uuid}`);
//       responseLines.push(''); // Empty line for readability
//     });
    
//     return {
//       content: [
//         {
//           type: 'text',
//           text: responseLines.join('\n'),
//         },
//       ],
//     };
//   }
// );

// // Register tool: Get product info by name
// server.tool(
//   'get-product-info',
//   'Get detailed information about a specific Red Hat product',
//   {
//     productName: z.string().describe('The name of the product to look up'),
//   },
//   async ({ productName }) => {
//     const product = await fetchProductByName(productName);
    
//     if (!product) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: `Product "${productName}" not found. Please check the name and try again.`,
//           },
//         ],
//       };
//     }
    
//     // Build the response text
//     const responseLines = [
//       `# ${product.name} Product Lifecycle Information`,
//       '',
//     ];
    
//     if (product.former_names && product.former_names.length > 0) {
//       responseLines.push(`Also known as: ${product.former_names.join(', ')}`);
//       responseLines.push('');
//     }
    
//     responseLines.push('## Versions');
//     responseLines.push('');
    
//     if (!product.versions || product.versions.length === 0) {
//       responseLines.push('No version information available for this product.');
//     } else {
//       product.versions.forEach(version => {
//         const status = getLifecycleStatus(version);
//         const timeRemaining = getTimeRemaining(version);
        
//         responseLines.push(`### ${version.name} (${status})`);
//         responseLines.push('');
        
//         version.phases.forEach(phase => {
//           responseLines.push(`- **${phase.name}**: ${formatDate(phase.date)}`);
//         });
        
//         responseLines.push(`- **Current Status**: ${status}`);
//         responseLines.push(`- **Time Remaining**: ${timeRemaining}`);
        
//         if (version.tier && version.tier !== "N/A") {
//           responseLines.push(`- **Tier**: ${version.tier}`);
//         }
        
//         if (version.openshift_compatibility) {
//           responseLines.push(`- **OpenShift Compatibility**: ${JSON.stringify(version.openshift_compatibility)}`);
//         }
        
//         if (version.additional_text) {
//           responseLines.push(`- **Additional Information**: ${version.additional_text}`);
//         }
        
//         responseLines.push('');
//       });
//     }
    
//     if (product.footnote) {
//       responseLines.push(`**Note**: ${product.footnote}`);
//       responseLines.push('');
//     }
    
//     if (product.link) {
//       responseLines.push(`For more information, visit: ${product.link}`);
//     }
    
//     return {
//       content: [
//         {
//           type: 'text',
//           text: responseLines.join('\n'),
//         },
//       ],
//     };
//   }
// );

// // Register tool: Get product info by UUID
// server.tool(
//   'get-product-by-uuid',
//   'Get detailed information about a specific Red Hat product using its UUID',
//   {
//     uuid: z.string().describe('The UUID of the product to look up'),
//   },
//   async ({ uuid }) => {
//     const product = await fetchProductByUUID(uuid);
    
//     if (!product) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: `Product with UUID "${uuid}" not found. Please check the UUID and try again.`,
//           },
//         ],
//       };
//     }
    
//     // Build the response text - same format as get-product-info
//     const responseLines = [
//       `# ${product.name} Product Lifecycle Information`,
//       '',
//     ];
    
//     if (product.former_names && product.former_names.length > 0) {
//       responseLines.push(`Also known as: ${product.former_names.join(', ')}`);
//       responseLines.push('');
//     }
    
//     responseLines.push('## Versions');
//     responseLines.push('');
    
//     if (!product.versions || product.versions.length === 0) {
//       responseLines.push('No version information available for this product.');
//     } else {
//       product.versions.forEach(version => {
//         const status = getLifecycleStatus(version);
//         const timeRemaining = getTimeRemaining(version);
        
//         responseLines.push(`### ${version.name} (${status})`);
//         responseLines.push('');
        
//         version.phases.forEach(phase => {
//           responseLines.push(`- **${phase.name}**: ${formatDate(phase.date)}`);
//         });
        
//         responseLines.push(`- **Current Status**: ${status}`);
//         responseLines.push(`- **Time Remaining**: ${timeRemaining}`);
        
//         if (version.tier && version.tier !== "N/A") {
//           responseLines.push(`- **Tier**: ${version.tier}`);
//         }
        
//         if (version.openshift_compatibility) {
//           responseLines.push(`- **OpenShift Compatibility**: ${JSON.stringify(version.openshift_compatibility)}`);
//         }
        
//         if (version.additional_text) {
//           responseLines.push(`- **Additional Information**: ${version.additional_text}`);
//         }
        
//         responseLines.push('');
//       });
//     }
    
//     if (product.footnote) {
//       responseLines.push(`**Note**: ${product.footnote}`);
//       responseLines.push('');
//     }
    
//     if (product.link) {
//       responseLines.push(`For more information, visit: ${product.link}`);
//     }
    
//     return {
//       content: [
//         {
//           type: 'text',
//           text: responseLines.join('\n'),
//         },
//       ],
//     };
//   }
// );

// // Register tool: Find versions by support status
// server.tool(
//   'find-versions-by-status',
//   'Find product versions with a specific support status',
//   {
//     productName: z.string().describe('The name of the product to look up'),
//     status: z.enum(['Full Support', 'Maintenance Support', 'End of Life', 'Future Release'])
//       .describe('The support status to filter by'),
//   },
//   async ({ productName, status }) => {
//     const product = await fetchProductByName(productName);
    
//     if (!product) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: `Product "${productName}" not found. Please check the name and try again.`,
//           },
//         ],
//       };
//     }
    
//     if (!product.versions || product.versions.length === 0) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: `No version information available for ${product.name}.`,
//           },
//         ],
//       };
//     }
    
//     const matchingVersions = product.versions.filter(version => {
//       const versionStatus = getLifecycleStatus(version);
//       return versionStatus === status;
//     });
    
//     if (matchingVersions.length === 0) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: `No versions of ${product.name} with status "${status}" found.`,
//           },
//         ],
//       };
//     }
    
//     const responseLines = [
//       `# ${product.name} Versions with Status: ${status}`,
//       '',
//       `Found ${matchingVersions.length} version${matchingVersions.length === 1 ? '' : 's'}:`,
//       ''
//     ];
    
//     matchingVersions.forEach(version => {
//       const timeRemaining = getTimeRemaining(version);
      
//       responseLines.push(`## ${version.name}`);
//       responseLines.push('');
      
//       version.phases.forEach(phase => {
//         responseLines.push(`- **${phase.name}**: ${formatDate(phase.date)}`);
//       });
      
//       responseLines.push(`- **Time Remaining**: ${timeRemaining}`);
//       responseLines.push('');
//     });
    
//     return {
//       content: [
//         {
//           type: 'text',
//           text: responseLines.join('\n'),
//         },
//       ],
//     };
//   }
// );

// // Register tool: Find versions expiring within time period
// server.tool(
//   'find-expiring-versions',
//   'Find product versions expiring within a specified number of days',
//   {
//     productName: z.string().describe('The name of the product to look up'),
//     days: z.number().describe('Number of days to look ahead for expiring versions'),
//   },
//   async ({ productName, days }) => {
//     const product = await fetchProductByName(productName);
    
//     if (!product) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: `Product "${productName}" not found. Please check the name and try again.`,
//           },
//         ],
//       };
//     }
    
//     if (!product.versions || product.versions.length === 0) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: `No version information available for ${product.name}.`,
//           },
//         ],
//       };
//     }
    
//     const now = new Date();
//     const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
//     const expiringVersions = product.versions.filter(version => {
//       // Check if Full Support or End of Life phases are within the time window
//       return version.phases.some(phase => {
//         if (phase.name === "Full support" || phase.name === "End of Life") {
//           const phaseDate = new Date(phase.date);
//           return phaseDate > now && phaseDate <= futureDate;
//         }
//         return false;
//       });
//     });
    
//     if (expiringVersions.length === 0) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: `No versions of ${product.name} are expiring within the next ${days} days.`,
//           },
//         ],
//       };
//     }
    
//     const responseLines = [
//       `# ${product.name} Versions Expiring Within ${days} Days`,
//       '',
//       `Found ${expiringVersions.length} version${expiringVersions.length === 1 ? '' : 's'} expiring soon:`,
//       ''
//     ];
    
//     expiringVersions.forEach(version => {
//       const status = getLifecycleStatus(version);
      
//       responseLines.push(`## ${version.name} (Currently: ${status})`);
//       responseLines.push('');
      
//       version.phases.forEach(phase => {
//         const phaseDate = new Date(phase.date);
//         if (phaseDate > now && phaseDate <= futureDate) {
//           const daysUntil = Math.ceil((phaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
//           responseLines.push(`- **${phase.name}**: ${formatDate(phase.date)} (in ${daysUntil} days)`);
//         } else {
//           responseLines.push(`- **${phase.name}**: ${formatDate(phase.date)}`);
//         }
//       });
      
//       responseLines.push('');
//     });
    
//     return {
//       content: [
//         {
//           type: 'text',
//           text: responseLines.join('\n'),
//         },
//       ],
//     };
//   }
// );

// // Register tool: Get all EOL products
// server.tool(
//   'get-eol-products',
//   'Get a list of all products with versions that have reached End of Life',
//   {},
//   async () => {
//     const products = await fetchProductsList();
    
//     if (!products || products.length === 0) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: 'No product data available or error connecting to Red Hat Product Lifecycle API.',
//           },
//         ],
//       };
//     }
    
//     const eolProducts = [];
    
//     // This could be inefficient as it requires fetching each product's details
//     // A better API would provide this information in a single call
//     for (const productSummary of products) {
//       const product = await fetchProductByUUID(productSummary.uuid);
//       if (!product || !product.versions || product.versions.length === 0) {
//         continue;
//       }
      
//       // Check if any version is EOL
//       const hasEolVersion = product.versions.some(version => 
//         getLifecycleStatus(version) === "End of Life"
//       );
      
//       if (hasEolVersion) {
//         eolProducts.push(product);
//       }
//     }
    
//     if (eolProducts.length === 0) {
//       return {
//         content: [
//           {
//             type: 'text',
//             text: 'No products with End of Life versions found.',
//           },
//         ],
//       };
//     }
    
//     const responseLines = [
//       '# Products with End of Life Versions',
//       '',
//       `Found ${eolProducts.length} product${eolProducts.length === 1 ? '' : 's'} with EOL versions:`,
//       ''
//     ];
    
//     eolProducts.forEach(product => {
//       responseLines.push(`## ${product.name}`);
//       responseLines.push('');
      
//       // List only EOL versions
//       const eolVersions = product.versions.filter(version => 
//         getLifecycleStatus(version) === "End of Life"
//       );
      
//       eolVersions.forEach(version => {
//         responseLines.push(`- **${version.name}**`);
//         const eolPhase = version.phases.find(phase => phase.name === "End of Life");
//         if (eolPhase) {
//           responseLines.push(`  EOL Date: ${formatDate(eolPhase.date)}`);
//         }
//       });
      
//       responseLines.push('');
//     });
    
//     return {
//       content: [
//         {
//           type: 'text',
//           text: responseLines.join('\n'),
//         },
//       ],
//     };
//   }
// );

// async function main() {
//   const transport = new StdioServerTransport();
//   await server.connect(transport);
//   console.error('Red Hat Product Lifecycle MCP Server running on stdio');
// }

// main().catch((error) => {
//   console.error('Fatal error in main():', error);
//   process.exit(1);
// });
