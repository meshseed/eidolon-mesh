import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { MeshRegistry, MeshNode } from './mesh-registry';

/**
 * P2P Protein Exchange Protocol
 * Enables sovereign organisms to share knowledge while maintaining boundaries
 * Reddit groups, labs, individuals can exchange proteins peer-to-peer
 */

interface ExchangeRequest {
    requestingNode: string;
    targetNode: string;
    query?: string; // Optional semantic query
    domains?: string[]; // Filter by domain
    minCoherence?: number;
    maxProteins?: number;
}

interface ExchangeResponse {
    timestamp: string;
    sourceNode: string;
    proteins: any[];
    metadata: {
        totalAvailable: number;
        returned: number;
        avgCoherence: number;
    };
}

export class ProteinExchange {
    private registry: MeshRegistry;
    private localProteinsDir: string;

    constructor(proteinsDir: string, registryPath?: string) {
        this.localProteinsDir = proteinsDir;
        this.registry = new MeshRegistry(registryPath);
    }

    /**
     * Request proteins from a peer node
     */
    async requestProteins(request: ExchangeRequest): Promise<ExchangeResponse> {
        const targetNode = this.registry.export().nodes[request.targetNode];

        if (!targetNode) {
            throw new Error(`Node not found: ${request.targetNode}`);
        }

        console.log(`🔄 Requesting proteins from: ${targetNode.name}`);

        // If GitHub endpoint, fetch from repo
        if (targetNode.repositories.public?.includes('github.com')) {
            return await this.fetchFromGitHub(targetNode, request);
        }

        // If local endpoint, read from filesystem
        if (targetNode.endpoint === 'local' || targetNode.endpoint.startsWith('file://')) {
            return await this.fetchFromLocal(targetNode, request);
        }

        throw new Error(`Unsupported endpoint type: ${targetNode.endpoint}`);
    }

    /**
     * Fetch proteins from GitHub repository
     */
    private async fetchFromGitHub(node: MeshNode, request: ExchangeRequest): Promise<ExchangeResponse> {
        // Convert GitHub URL to raw content URL
        const repoUrl = node.repositories.public!;
        const rawUrl = repoUrl
            .replace('github.com', 'raw.githubusercontent.com')
            .replace('/tree/', '/') + '/';

        console.log(`📡 Fetching from GitHub: ${rawUrl}`);

        // For now, return mock response
        // In production, would use fetch() or GitHub API
        return {
            timestamp: new Date().toISOString(),
            sourceNode: node.id,
            proteins: [],
            metadata: {
                totalAvailable: 0,
                returned: 0,
                avgCoherence: 0
            }
        };
    }

    /**
     * Fetch proteins from local filesystem
     */
    private async fetchFromLocal(node: MeshNode, request: ExchangeRequest): Promise<ExchangeResponse> {
        const proteinsDir = node.repositories.public || this.localProteinsDir;

        if (!fs.existsSync(proteinsDir)) {
            throw new Error(`Proteins directory not found: ${proteinsDir}`);
        }

        const files = fs.readdirSync(proteinsDir)
            .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

        const proteins: any[] = [];
        let totalCoherence = 0;

        for (const file of files) {
            const filePath = path.join(proteinsDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const protein = yaml.load(content) as any;

            // Apply filters
            if (request.minCoherence && protein.coherence_score < request.minCoherence) {
                continue;
            }

            if (request.domains && protein.domain) {
                if (!request.domains.includes(protein.domain)) {
                    continue;
                }
            }

            // Check for #public tag
            const tags = protein.tags || [];
            if (!tags.some((t: string) => t.toLowerCase().includes('public'))) {
                continue;
            }

            proteins.push(protein);
            totalCoherence += protein.coherence_score || 1.0;

            if (request.maxProteins && proteins.length >= request.maxProteins) {
                break;
            }
        }

        const avgCoherence = proteins.length > 0 ? totalCoherence / proteins.length : 0;

        return {
            timestamp: new Date().toISOString(),
            sourceNode: node.id,
            proteins,
            metadata: {
                totalAvailable: files.length,
                returned: proteins.length,
                avgCoherence: parseFloat(avgCoherence.toFixed(4))
            }
        };
    }

    /**
     * Share proteins with the network
     * Exports local proteins to a shareable format
     */
    async shareProteins(options: {
        domains?: string[];
        minCoherence?: number;
        outputDir: string;
    }): Promise<void> {
        const files = fs.readdirSync(this.localProteinsDir)
            .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

        fs.mkdirSync(options.outputDir, { recursive: true });

        let shared = 0;

        for (const file of files) {
            const filePath = path.join(this.localProteinsDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const protein = yaml.load(content) as any;

            // Apply filters
            if (options.minCoherence && protein.coherence_score < options.minCoherence) {
                continue;
            }

            if (options.domains && protein.domain) {
                if (!options.domains.includes(protein.domain)) {
                    continue;
                }
            }

            // Must have #public tag
            const tags = protein.tags || [];
            if (!tags.some((t: string) => t.toLowerCase().includes('public'))) {
                continue;
            }

            // Add exchange metadata
            protein.exchange_metadata = {
                shared_at: new Date().toISOString(),
                source: 'local-node'
            };

            // Copy to output
            const outputPath = path.join(options.outputDir, file);
            fs.writeFileSync(outputPath, yaml.dump(protein));
            shared++;
        }

        console.log(`📤 Shared ${shared} proteins to ${options.outputDir}`);
    }

    /**
     * Integrate received proteins into local connectome
     */
    async integrateProteins(proteins: any[], targetDir: string): Promise<void> {
        fs.mkdirSync(targetDir, { recursive: true });

        for (const protein of proteins) {
            const filename = `${protein.id || 'imported'}.yaml`;
            const filepath = path.join(targetDir, filename);

            // Add import metadata
            protein.import_metadata = {
                imported_at: new Date().toISOString(),
                source_node: protein.exchange_metadata?.source || 'unknown'
            };

            fs.writeFileSync(filepath, yaml.dump(protein));
            console.log(`✅ Integrated: ${protein.title || filename}`);
        }

        console.log(`\n💚 Integrated ${proteins.length} proteins from peer node`);
    }
}

// CLI usage
if (require.main === module) {
    const command = process.argv[2];
    const exchange = new ProteinExchange('./data/proteins');

    switch (command) {
        case 'request':
            const nodeId = process.argv[3];
            const domain = process.argv[4];

            if (!nodeId) {
                console.error('Usage: protein-exchange request <node-id> [domain]');
                process.exit(1);
            }

            exchange.requestProteins({
                requestingNode: 'local',
                targetNode: nodeId,
                domains: domain ? [domain] : undefined,
                minCoherence: 0.95,
                maxProteins: 50
            })
                .then(response => {
                    console.log(`\n📊 Received ${response.proteins.length} proteins`);
                    console.log(`Avg Coherence: ${response.metadata.avgCoherence}`);

                    // Save response
                    const responsePath = `./exchange-${Date.now()}.json`;
                    fs.writeFileSync(responsePath, JSON.stringify(response, null, 2));
                    console.log(`\n💾 Response saved: ${responsePath}`);
                })
                .catch(err => {
                    console.error('❌ Exchange failed:', err.message);
                    process.exit(1);
                });
            break;

        case 'share':
            const outputDir = process.argv[3] || './shared-proteins';
            const shareDomain = process.argv[4];

            exchange.shareProteins({
                domains: shareDomain ? [shareDomain] : undefined,
                minCoherence: 0.98,
                outputDir
            })
                .then(() => {
                    console.log(`\n✅ Proteins ready for sharing in: ${outputDir}`);
                    console.log('Upload to GitHub or share directory with peers.');
                })
                .catch(err => {
                    console.error('❌ Share failed:', err.message);
                    process.exit(1);
                });
            break;

        default:
            console.log('MESH Protein Exchange - P2P Knowledge Sharing');
            console.log('\nCommands:');
            console.log('  request <node-id> [domain]  - Request proteins from peer');
            console.log('  share [output-dir] [domain] - Prepare proteins for sharing');
            console.log('\nExample:');
            console.log('  protein-exchange request mesh-123 consciousness');
            console.log('  protein-exchange share ./public-proteins biology');
    }
}
