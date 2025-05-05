# Red Hat Product Lifecycle MCP Server

## Overview

This MCP (Model Context Protocol) server, `product-lifecycle-api`, provides access to Red Hat product lifecycle data. It allows AI tools and applications to query information about Red Hat product versions, support statuses, and upcoming lifecycle events.

## Features

* **Product Information**: Retrieve detailed lifecycle information for Red Hat products, including version details, support phases, and end-of-life dates.
* **Lifecycle Status**: Determine the current lifecycle status of a product version (e.g., Full Support, Maintenance Support, End of Life).
* **Time Remaining**: Calculate the time remaining until the next lifecycle phase transition.
* **Version Filtering**: Find product versions based on their support status or those expiring within a specified time period.

## Tools

The server provides the following MCP tools:

* `get-all-products`: Retrieves a list of all available Red Hat products.
* `get-product-info`: Retrieves detailed lifecycle information for a specific product, including version details and support phases.
* `find-versions-by-status`: Lists product versions that match a specific support status.
* `find-expiring-versions`: Finds product versions that will expire within a specified number of days.

## Data Source

The server fetches product lifecycle data from the Red Hat API:

`https://access.redhat.com/product-life-cycles/api/v1/products/`

## Setup

### Prerequisites

* Node.js
* An MCP client (e.g., a compatible AI tool or application)

### Installation

1.  Clone this repository.
2.  Install the dependencies:

    ```bash
    npm install
    ```

### Running the Server

1.  Start the server:

    ```bash
    npm start
    ```

    The server will listen for MCP requests via standard input/output.

### Usage

To use the server, send MCP requests from a compatible client. Here are example requests for each tool:

* **Get all products:**

    ```json
    {
      "tool_name": "get-all-products",
      "input": {}
    }
    ```

* **Get product info:**

    ```json
    {
      "tool_name": "get-product-info",
      "input": {
        "productName": "Red Hat Enterprise Linux"
      }
    }
    ```

* **Find versions by status:**

    ```json
    {
      "tool_name": "find-versions-by-status",
      "input": {
        "productName": "Red Hat OpenShift Container Platform",
        "status": "Full Support"
      }
    }
    ```

* **Find expiring versions:**

    ```json
    {
      "tool_name": "find-expiring-versions",
      "input": {
        "productName": "Red Hat Ansible Automation Platform",
        "days": 30
      }
    }
    ```

Refer to the MCP client documentation for instructions on sending requests and handling responses.

## Data Structure

The server uses the following data structures:

```typescript
interface ProductPhase {
  name: string;
  date: string;
  date_format: string;
  additional_text: string;
}

interface ProductVersion {
  name: string;
  type: string;
  phases: ProductPhase[];
  tier?: string;
  openshift_compatibility?: any;
  additional_text: string;
  extra_dependences: any[];
}

interface Product {
  uuid: string;
  name: string;
  former_names: string[];
  versions: ProductVersion[];
  is_layered_product: boolean;
  footnote: string;
  is_operator: boolean;
  link?: string;
}
