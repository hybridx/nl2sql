import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Define interfaces for lab data
interface Lab {
  id: string;
  url: string;
  name: string;
  description: string;
}

// Create server instance
const server = new McpServer({
  name: 'lab-finder',
  version: '1.0.0',
  capabilities: {
    resources: {},
    tools: {},
  },
});

const labsData = {
  rhel: [
    {
      id: 'rsyslogch',
      url: 'https://access.redhat.com/labs/rsyslogch',
      name: 'Rsyslog Configuration Helper',
      description:
        'This lab will simplify the process of setting up local and remote logging by providing tailored configuration examples based on your requirements. It offers step-by-step suggestions to optimize log management. The app also recommends relevant knowledge base articles for deeper understanding and troubleshooting.',
    },
    {
      id: 'registrationassistant',
      url: 'https://access.redhat.com/labs/registrationassistant',
      name: 'Registration Assistant',
      description:
        'Your guide to registering your Red Hat Enterprise Linux systems.',
    },
    {
      id: 'kickstartconfig',
      url: 'https://access.redhat.com/labs/kickstartconfig',
      name: 'Kickstart Generator',
      description:
        'Generate a custom kickstart file based on your configuration parameters.',
    },
    {
      id: 'kickstartconvert',
      url: 'https://access.redhat.com/labs/kickstartconvert',
      name: 'Kickstart Converter',
      description:
        'This application helps you convert a Kickstart file used to install an earlier version of Red Hat Enterprise Linux to a Kickstart file that can be used with a later version of Red Hat Enterprise Linux installation, such as RHEL7->RHEL8,RHEL9, RHEL8->RHEL9.',
    },
    {
      id: 'sshvh',
      url: 'https://access.redhat.com/labs/sshvh',
      name: 'SSH Vulnerability Helper',
      description:
        'This application helps fix/mitigate SSH vulnerabilities in Red Hat Enterprise Linux. With the help of this application you will proactively be able to get solutions for these vulnerabilities. An integrated Ansible playbook is also available for automatic remediation.',
    },
    {
      id: 'kdumphelper',
      url: 'https://access.redhat.com/labs/kdumphelper',
      name: 'Kdump Helper',
      description:
        'The Kdump Helper app is designed to simplify the process and reduce the effort required to set up Kdump on your machines. The app will generate a script for you to set up Kdump based on the information you provided.',
    },
    {
      id: 'virtwhoconfig',
      url: 'https://access.redhat.com/labs/virtwhoconfig',
      name: 'Red Hat Virtualization Agent (virt-who) Configuration Helper',
      description:
        'This application requests information about your virt-who usage and generates a configuration file based on the answers. It also provides instructions for updating your virt-who configuration.',
    },
    {
      id: 'kerneloopsanalyzer',
      url: 'https://access.redhat.com/labs/kerneloopsanalyzer',
      name: 'Kernel Oops Analyzer',
      description:
        'This tool is designed to help you diagnose a kernel crash. When you input a text or vmcore-dmesg.txt or a file including one or more kernel oops messages, we will walk you through diagnosing the kernel crash issue.',
    },
    {
      id: 'rhma',
      url: 'https://access.redhat.com/labs/rhma',
      name: 'Red Hat Memory Analyzer',
      description:
        'Sar file records the cumulative activity of various Linux subsystems including CPU, memory, device I/O, networking, etc. This lab gives a visualized memory related report.',
    },
    {
      id: 'nfshelper',
      url: 'https://access.redhat.com/labs/nfshelper',
      name: 'NFS Helper',
      description:
        'Generate a configuration script for a new NFS server or client.',
    },
    {
      id: 'ooma',
      url: 'https://access.redhat.com/labs/ooma',
      name: 'Red Hat Out Of Memory Analyzer',
      description:
        'OOM Analyzer is designed to analyze and interpret OOM messages from the Linux kernel.',
    },
    {
      id: 'adih',
      url: 'https://access.redhat.com/labs/adih',
      name: 'AD Integration Helper (Samba FS - winbind)',
      description:
        'This tool helps you connect a Red Hat Enterprise Linux system to an Active Directory server by generating Samba Winbind configuration.',
    },
    {
      id: 'rbra',
      url: 'https://access.redhat.com/labs/rbra',
      name: 'RHEL Backup and Restore Assistant',
      description:
        'This application provides information about backing up and restoring information.',
    },
    {
      id: 'rheltfo',
      url: 'https://access.redhat.com/labs/rheltfo',
      name: 'RHEL Tuner for Oracle',
      description:
        "This application will generate a script to set the tuning parameter in the operating system, which will help Oracle's performance.",
    },
    {
      id: 'rhiou',
      url: 'https://access.redhat.com/labs/rhiou',
      name: 'Red Hat I/O Usage Visualizer',
      description:
        'Red Hat I/O Usage Visualizer displays a visualization of the I/O device usage statistics captured by the sar utility.',
    },
    {
      id: 'rescuemodeassistant',
      url: 'https://access.redhat.com/labs/rescuemodeassistant',
      name: 'Rescue Mode Assistant',
      description:
        "Rescue mode provides the ability to boot a Red Hat Enterprise Linux environment entirely from CD-ROM, or some other boot method, instead of the system's hard drive.",
    },
    {
      id: 'yumrepoconfighelper',
      url: 'https://access.redhat.com/labs/yumrepoconfighelper',
      name: 'Yum Repository Configuration Helper',
      description:
        'This tool will help you set up a simple Yum repository for your local machine or a small number of other machines to use.',
    },
    {
      id: 'networkbondinghelper',
      url: 'https://access.redhat.com/labs/networkbondinghelper',
      name: 'Network Bonding Helper',
      description:
        "Configure two or more network interfaces to act as one 'bonded' interface, simultaneously increasing the bandwidth and providing redundancy.",
    },
    {
      id: 'systemdgenerator',
      url: 'https://access.redhat.com/labs/systemdgenerator',
      name: 'Systemd Unit Generator',
      description:
        'This application is designed to assist you in generating both systemd service unit and timer files. It simplifies the process by allowing you to create these configurations based on your specific requirements.',
    },
    {
      id: 'multipathhelper',
      url: 'https://access.redhat.com/labs/multipathhelper',
      name: 'Multipath Helper',
      description:
        'Create optimal multipath configurations for Red Hat Enterprise Linux 5, 6, 7, 8 or 9 that are tailored to meet specific deployment goals.',
    },
    {
      id: 'nptcpdump',
      url: 'https://access.redhat.com/labs/nptcpdump',
      name: 'Packet Capture Syntax Generator',
      description:
        'The Packet capture syntax generator application will generate a tcpdump command to capture network packets.',
    },
    {
      id: 'ntpcc',
      url: 'https://access.redhat.com/labs/ntpcc',
      name: 'NTP Configuration',
      description:
        'This application steps you through a guide that generates a script for setting up NTP (Network Time Protocol) clients and servers.',
    },
    {
      id: 'pfch',
      url: 'https://access.redhat.com/labs/pfch',
      name: 'Postfix Configuration Helper',
      description:
        'This application is designed to help you to configure and troubleshoot some of the Postfix Issues reported on Red Hat Enterprise Linux.',
    },
    {
      id: 'vncconfig',
      url: 'https://access.redhat.com/labs/vncconfig',
      name: 'VNC Configurator',
      description:
        'This application is a one stop shop which gives the options to the customer to either automatically configure VNC or Validate an existing VNC Configuration to work well in their environment.',
    },
    {
      id: 'iscsihelper',
      url: 'https://access.redhat.com/labs/iscsihelper',
      name: 'iSCSI Helper',
      description:
        'The iSCSI helper tool simplifies configuring an iSCSI target (server) or initiator (client).',
    },
    {
      id: 'teamdconfighelper',
      url: 'https://access.redhat.com/labs/teamdconfighelper',
      name: 'Network Teaming Helper',
      description:
        'This app is designed to help you configure network teaming. The app will generate a script for you to configure network teaming based on the information you provided.',
    },
    {
      id: 'dnshelper',
      url: 'https://access.redhat.com/labs/dnshelper',
      name: 'DNS Helper',
      description: 'A tool to help configure your nameserver.',
    },
    {
      id: 'nvme',
      url: 'https://access.redhat.com/labs/nvme',
      name: 'Non-volatile Memory Express',
      description:
        'This application will guide you through the process of configuring NVMe for network hosts using various transport protocols, including RDMA (Remote Direct Memory Access), FC (Fibre Channel), and TCP.',
    },
  ],
  openshift: [
    {
      id: 'ocpupgradegraph',
      url: 'https://access.redhat.com/labs/ocpupgradegraph',
      name: 'Red Hat OpenShift Container Platform Update Graph',
      description:
        "This application is designed to help you visualize Red Hat's recommended updates of OpenShift Container Platform with a directed acyclic graph (DAG). You can get a graph visualization of the update graph by channel, or get the shortest update path between two versions, including upgrade instructions for both the CLI and Web Console.",
    },
    {
      id: 'ocpouic',
      url: 'https://access.redhat.com/labs/ocpouic',
      name: 'Red Hat OpenShift Container Platform Operator Update Information Checker',
      description:
        'This application provides information on the update channels and feasible versions of Red Hat Operators to help you prepare OpenShift updates.',
    },
    {
      id: 'odfsi',
      url: 'https://access.redhat.com/labs/odfsi',
      name: 'Red Hat OpenShift Data Foundation Supportability and Interoperability Checker',
      description:
        'This application helps check the supportability and interoperability of Red Hat OpenShift Data Foundation 4.X. Based on your selections, it shows supported versions, platforms, integrations, limits, image SHA values, and version mappings.',
    },
    {
      id: 'ocsst',
      url: 'https://access.redhat.com/labs/ocsst',
      name: 'ODF Sizer',
      description: 'No description available.',
    },
    {
      id: 'ocpnc',
      url: 'https://access.redhat.com/labs/ocpnc',
      name: 'Red Hat OpenShift Network Calculator',
      description:
        'This tool helps design your OpenShift cluster network during deployment and scaling phases. It detects common networking issues, identifies conflicts, and outputs results in a JSON format.',
    },
    {
      id: 'ocplimitscalculator',
      url: 'https://access.redhat.com/labs/ocplimitscalculator',
      name: 'Red Hat OpenShift Limits Calculator',
      description:
        'This tool assists in OpenShift 4.x installation by helping identify potential cloud provider quota issues. It streamlines opening support requests and understanding where default cloud limits might be exceeded, helping ensure a smoother deployment.',
    },
    {
      id: 'ocpch',
      url: 'https://access.redhat.com/labs/ocpch',
      name: 'OpenShift Packet Capture Helper',
      description:
        'OCPCH is a tool designed to simplify packet capturing in OpenShift clusters. It provides a user-friendly interface to select the CNI and network flow, helping determine capture points easily.',
    },
    {
      id: 'osdfrc',
      url: 'https://access.redhat.com/labs/osdfrc',
      name: 'OpenShift Data Foundation Ceph Recovery Calculator',
      description:
        'This calculator estimates recovery time based on parameters like number of disks, failure domain, disk size, and network setup.',
    },
  ],
  others: [
    {
      id: 'rhsih',
      url: 'https://access.redhat.com/labs/rhsih',
      name: 'Red Hat Satellite Installation Helper',
      description:
        'This application helps you install the Satellite Server or Capsule Server for Red Hat Satellite.',
    },
    {
      id: 'cvechecker',
      url: 'https://access.redhat.com/labs/cvechecker',
      name: 'Red Hat CVE Checker',
      description:
        'This application helps you retrieve details of CVEs (Common Vulnerabilities and Exposures).',
    },
    {
      id: 'satelliteupgradehelper',
      url: 'https://access.redhat.com/labs/satelliteupgradehelper',
      name: 'Red Hat Satellite Upgrade Helper',
      description:
        'This application assists in upgrading Red Hat Satellite 6. It provides upgrade steps and extra actions to prevent known issues specific to your upgrade path.',
    },
    {
      id: 'rhpc',
      url: 'https://access.redhat.com/labs/rhpc',
      name: 'Red Hat Product Certificates',
      description:
        'This application helps you retrieve and install product certificate files required for Red Hat Subscription Management to recognize installed Red Hat products.',
    },
    {
      id: 'lbconfig',
      url: 'https://access.redhat.com/labs/lbconfig',
      name: 'Load Balancer Configuration Tool',
      description:
        'This tool assists in creating optimal configurations for Apache-based load balancers and JBoss/Tomcat servers. It analyzes deployment details to improve performance.',
    },
    {
      id: 'cephpgc',
      url: 'https://access.redhat.com/labs/cephpgc',
      name: 'Ceph Placement Groups (PGs) per Pool Calculator',
      description:
        'This tool calculates suggested PG count per pool and total PG count in Ceph. It also generates commands for pool creation.',
    },
    {
      id: 'jvmconfig',
      url: 'https://access.redhat.com/labs/jvmconfig',
      name: 'JVM Options Configuration Tool',
      description:
        'This tool generates optimized JVM options based on environment and JVM type. It explains each option and links to relevant knowledge base articles.',
    },
    {
      id: 'rhpeac',
      url: 'https://access.redhat.com/labs/rhpeac',
      name: 'Red Hat Product Errata Advisory Checker',
      description:
        'This application helps retrieve Red Hat Product Errata. You can filter by type, product, year, and export advisories to CSV.',
    },
    {
      id: 'rhvupgradehelper',
      url: 'https://access.redhat.com/labs/rhvupgradehelper',
      name: 'Red Hat Virtualization Upgrade Helper',
      description:
        'This application helps upgrade RHV to a newer version. It provides tailored upgrade steps and preventive measures for known issues.',
    },
    {
      id: 'aapua',
      url: 'https://access.redhat.com/labs/aapua',
      name: 'Ansible Automation Platform Upgrade Assistant',
      description:
        'This app is designed to help you upgrade your Ansible Automation Platform to a newer version.',
    },
    {
      id: 'aapifg',
      url: 'https://access.redhat.com/labs/aapifg',
      name: 'Ansible Automation Platform Inventory File Generator',
      description:
        "This application will allow you to create the Ansible Automation Platform 'inventory' file, which is the basis for any installation. With zero knowledge, we will guide you through a number of questions so you can select your preferences. This application will generate an inventory file to be used for an Ansible Automation Platform deployment that will require 3-6 virtual machines or servers. The final number of servers and suggestions for sizing will be provided in the final page where the inventory file will also be downloaded. An external postgres server is required for this installation. There will be an option to either allow the installer to provision one on a VM or provide details for a pre-built postgres server.",
    },
  ],
};

function loadLabData(category: keyof typeof labsData): Lab[] {
  return labsData[category];
}

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
function registerLabTool(category: keyof typeof labsData, displayName: string) {
  server.tool(
    `find-lab-${category}`,
    `Get recommendations for ${displayName} labs, tools, or guides based on user questions`,
    {
      query: z
        .string()
        .describe(
          `A user's natural language request for ${displayName} resources`
        ),
    },
    async ({ query }) => {
      const labs = loadLabData(category);

      if (!labs || labs.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to load ${displayName} lab data.`,
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
              text: `No matching ${displayName} resources found. Try rephrasing or asking about a different topic.`,
            },
          ],
        };
      }

      const responseText = [
        `Here’s something that might help you with ${displayName}:`,
        ``,
        `**Name**: ${matchedLab.name}`,
        `**Description**: ${matchedLab.description}`,
        ``,
        `Access it here: ${matchedLab.url}`,
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
}

registerLabTool('rhel', 'RHEL');
registerLabTool('openshift', 'OpenShift');
registerLabTool('others', 'Ansible, Satellite, JBoss and others');

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Lab Finder MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
