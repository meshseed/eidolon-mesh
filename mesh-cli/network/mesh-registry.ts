import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * MESH Node Registry - P2P Discovery
 * Enables distributed organisms to find and connect with each other
 * Reddit groups, research labs, individual nodes can all join the mesh
 */

interface MeshNode {
    id: string;
    name: string;
    description: string;
    endpoint: string; // URL or GitHub repo
    publicKey?: string; // For verification
    repositories: {
        public?: string; // Public knowledge repo
        proteins?: string; // Protein exchange endpoint
    };
    capabilities: string[]; // e.g., ["synthesis", "query", "export"]
    domains: string[]; // Knowledge domains (e.g., ["consciousness", "biology"])
    lastSeen: string;
    coherence?: number;
}

interface NodeRegistry {
    version: string;
    updated: string;
    nodes: Record<string, MeshNode>;
    metadata: {
        totalNodes: number;
        activeDomains: string[];
    };
}

const REGISTRY_FILE = './mesh-registry.json';

export class MeshRegistry {
    private registry: NodeRegistry;

    constructor(registryPath: string = REGISTRY_FILE) {
        if (fs.existsSync(registryPath)) {
            const data = fs.readFileSync(registryPath, 'utf-8');
            this.registry = JSON.parse(data);
        } else {
            this.registry = {
                version: '1.0',
                updated: new Date().toISOString(),
                nodes: {},
                metadata: {
                    totalNodes: 0,
                    activeDomains: []
                }
            };
        }
    }

    /**
     * Register a new node in the mesh
     */
    registerNode(node: MeshNode): void {
        this.registry.nodes[node.id] = {
            ...node,
            lastSeen: new Date().toISOString()
        };

        this.updateMetadata();
        console.log(`✅ Registered node: ${node.name} (${node.id})`);
    }

    /**
     * Discover nodes by domain
     */
    discoverByDomain(domain: string): MeshNode[] {
        return Object.values(this.registry.nodes)
            .filter(node => node.domains.includes(domain));
    }

    /**
     * Discover nodes by capability
     */
    discoverByCapability(capability: string): MeshNode[] {
        return Object.values(this.registry.nodes)
            .filter(node => node.capabilities.includes(capability));
    }

    /**
     * Get all active nodes (seen in last 30 days)
     */
    getActiveNodes(): MeshNode[] {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return Object.values(this.registry.nodes)
            .filter(node => new Date(node.lastSeen) > thirtyDaysAgo);
    }

    /**
     * Update node heartbeat
     */
    heartbeat(nodeId: string): void {
        if (this.registry.nodes[nodeId]) {
            this.registry.nodes[nodeId].lastSeen = new Date().toISOString();
        }
    }

    /**
     * Update metadata
     */
    private updateMetadata(): void {
        const allDomains = new Set<string>();
        Object.values(this.registry.nodes).forEach(node => {
            node.domains.forEach(d => allDomains.add(d));
        });

        this.registry.metadata = {
            totalNodes: Object.keys(this.registry.nodes).length,
            activeDomains: Array.from(allDomains)
        };
        this.registry.updated = new Date().toISOString();
    }

    /**
     * Save registry to disk
     */
    save(path: string = REGISTRY_FILE): void {
        fs.writeFileSync(path, JSON.stringify(this.registry, null, 2));
        console.log(`💾 Registry saved: ${this.registry.metadata.totalNodes} nodes`);
    }

    /**
     * Export registry for sharing
     */
    export(): NodeRegistry {
        return this.registry;
    }

    /**
     * Import nodes from another registry
     */
    import(externalRegistry: NodeRegistry): void {
        Object.entries(externalRegistry.nodes).forEach(([id, node]) => {
            // Only import if newer or not exists
            if (!this.registry.nodes[id] ||
                new Date(node.lastSeen) > new Date(this.registry.nodes[id].lastSeen)) {
                this.registry.nodes[id] = node;
            }
        });

        this.updateMetadata();
        console.log(`📥 Imported registry: ${Object.keys(externalRegistry.nodes).length} nodes`);
    }
}

/**
 * Create a node profile for this organism
 */
export function createNodeProfile(config: {
    name: string;
    description: string;
    githubRepo?: string;
    domains: string[];
    capabilities?: string[];
}): MeshNode {
    return {
        id: generateNodeId(),
        name: config.name,
        description: config.description,
        endpoint: config.githubRepo || 'local',
        repositories: {
            public: config.githubRepo ? `${config.githubRepo}/data/proteins` : undefined
        },
        capabilities: config.capabilities || ['query', 'synthesis'],
        domains: config.domains,
        lastSeen: new Date().toISOString()
    };
}

function generateNodeId(): string {
    return `mesh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// CLI usage
if (require.main === module) {
    const command = process.argv[2];
    const registry = new MeshRegistry();

    switch (command) {
        case 'register':
            const name = process.argv[3];
            const github = process.argv[4];
            const domains = process.argv.slice(5);

            if (!name || domains.length === 0) {
                console.error('Usage: mesh-registry register <name> <github-repo> <domains...>');
                process.exit(1);
            }

            const node = createNodeProfile({
                name,
                description: `MESH node: ${name}`,
                githubRepo: github,
                domains
            });

            registry.registerNode(node);
            registry.save();

            console.log('\n📋 Node Profile:');
            console.log(JSON.stringify(node, null, 2));
            break;

        case 'discover':
            const domain = process.argv[3];
            if (!domain) {
                console.error('Usage: mesh-registry discover <domain>');
                process.exit(1);
            }

            const nodes = registry.discoverByDomain(domain);
            console.log(`\n🔍 Found ${nodes.length} nodes in domain: ${domain}`);
            nodes.forEach(n => {
                console.log(`  - ${n.name} (${n.endpoint})`);
            });
            break;

        case 'list':
            const active = registry.getActiveNodes();
            console.log(`\n📊 Active Nodes: ${active.length}`);
            console.log(`Domains: ${registry.export().metadata.activeDomains.join(', ')}`);
            console.log('\nNodes:');
            active.forEach(n => {
                console.log(`  ${n.name}`);
                console.log(`    Endpoint: ${n.endpoint}`);
                console.log(`    Domains: ${n.domains.join(', ')}`);
                console.log(`    Last seen: ${n.lastSeen}`);
            });
            break;

        case 'export':
            const exportPath = process.argv[3] || './mesh-registry-export.json';
            registry.save(exportPath);
            console.log(`\n📤 Registry exported to: ${exportPath}`);
            console.log('Share this file with other MESH nodes to propagate the network.');
            break;

        case 'import':
            const importPath = process.argv[3];
            if (!importPath || !fs.existsSync(importPath)) {
                console.error('Usage: mesh-registry import <registry-file>');
                process.exit(1);
            }

            const externalRegistry = JSON.parse(fs.readFileSync(importPath, 'utf-8'));
            registry.import(externalRegistry);
            registry.save();
            break;

        default:
            console.log('MESH Node Registry - P2P Discovery');
            console.log('\nCommands:');
            console.log('  register <name> <github-repo> <domains...>  - Register this node');
            console.log('  discover <domain>                           - Find nodes by domain');
            console.log('  list                                        - List all active nodes');
            console.log('  export [path]                               - Export registry for sharing');
            console.log('  import <registry-file>                      - Import external registry');
            console.log('\nExample:');
            console.log('  mesh-registry register "My Lab" https://github.com/user/repo consciousness biology');
    }
}

export { MeshNode, NodeRegistry };
