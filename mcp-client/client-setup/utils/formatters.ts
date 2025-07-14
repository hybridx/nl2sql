export function formatToolResult(result: any): string {
    let formattedResult = "";
    
    if (Array.isArray(result.content)) {
      formattedResult = result.content.map((item: any) => {
        if (item.type === "text") {
          return item.text;
        } else if (item.type === "resource" && item.resource?.text) {
          return item.resource.text;
        } else {
          return JSON.stringify(item);
        }
      }).join("\n");
    } else if (typeof result.content === 'object') {
      formattedResult = JSON.stringify(result.content, null, 2);
    } else {
      formattedResult = String(result.content);
    }
    
    return formattedResult;
  }