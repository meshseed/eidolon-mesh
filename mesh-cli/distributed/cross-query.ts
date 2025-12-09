import fs from 'fs';
import path from 'path';
import { MeshRegistry, MeshNode } from '../network/mesh-registry';
import { ProteinExchange } from '../network/protein-exchange';

/**
 * Cross-Organism Query Router - MERGE Phase
 * Routes queries to specialist organisms and synthesizes unified responses
 * Enables distributed intelligence across the mesh
 */

interface QueryRequest {
    query: string;
    domains?: string[];
    maxNodes?: number;
    minCoherence?: number;
}

interface NodeResponse {
    nodeId: string;
    nodeName: string;
    proteins: any[];
    coherence: number;
    responseTime: number;
}

interface SynthesizedResponse {
    timestamp: string;
    query: string;
    nodeResponses: NodeResponse[];
    synthesis: {
        summary: string;
        keyInsights: string[];
        sources: string[];
        avgCoherence: number;
    };
    metadata: {
        nodesQueried: number;
        totalProteins: number;
        synthesisTime: number;
    };
}

export class QueryRouter {
    private registry: MeshRegistry;
    private exchange: ProteinExchange;

    constructor(proteinsDir: string, registryPath?: string) {
        this.registry = new MeshRegistry(registryPath);
        this.exchange = new ProteinExchange(proteinsDir, registryPath);
    }

    /**
     * Route query to specialist organisms and synthesize response
     */
    async routeQuery(request: QueryRequest): Promise<SynthesizedResponse> {
        const startTime = Date.now();

        console.log(`🔍 Routing query: "${request.query}"`);

        // Discover relevant nodes
        const nodes = this.discoverRelevantNodes(request);
        console.log(`📡 Found ${nodes.length} relevant nodes`);

        // Query each node
        const responses: NodeResponse[] = [];

        for (const node of nodes) {
            try {
                const nodeStart = Date.now();

                const result = await this.exchange.requestProteins({
                    requestingNode: 'local',
                    targetNode: node.id,
                    domains: request.domains,
                    minCoherence: request.minCoherence || 0.95,
                    maxProteins: 10
                });

                const nodeResponse: NodeResponse = {
                    nodeId: node.id,
                    nodeName: node.name,
                    proteins: result.proteins,
                    coherence: result.metadata.avgCoherence,
                    responseTime: Date.now() - nodeStart
                };

                responses.push(nodeResponse);
                console.log(`  ✅ ${node.name}: ${result.proteins.length} proteins (${result.metadata.avgCoherence.toFixed(3)})`);

            } catch (err: any) {
                console.log(`  ❌ ${node.name}: ${err.message}`);
            }
        }

        // Synthesize unified response
        const synthesis = this.synthesizeResponses(request.query, responses);

        const totalTime = Date.now() - startTime;

        return {
            timestamp: new Date().toISOString(),
            query: request.query,
            nodeResponses: responses,
            synthesis,
            metadata: {
                nodesQueried: nodes.length,
                totalProteins: responses.reduce((sum, r) => sum + r.proteins.length, 0),
                synthesisTime: totalTime
            }
        };
    }

    /**
     * Discover nodes relevant to query
     */
    private discoverRelevantNodes(request: QueryRequest): MeshNode[] {
        let nodes: MeshNode[] = [];

        // If domains specified, find nodes by domain
        if (request.domains && request.domains.length > 0) {
            request.domains.forEach(domain => {
                const domainNodes = this.registry.discoverByDomain(domain);
                nodes.push(...domainNodes);
            });
        } else {
            // Otherwise, get all active nodes
            nodes = this.registry.getActiveNodes();
        }

        // Remove duplicates
        const uniqueNodes = Array.from(
            new Map(nodes.map(n => [n.id, n])).values()
        );

        // Limit number of nodes
        if (request.maxNodes && uniqueNodes.length > request.maxNodes) {
            return uniqueNodes.slice(0, request.maxNodes);
        }

        return uniqueNodes;
    }

    /**
     * Synthesize responses from multiple nodes
     */
    private synthesizeResponses(query: string, responses: NodeResponse[]): {
        summary: string;
        keyInsights: string[];
        sources: string[];
        avgCoherence: number;
    } {
        // Collect all insights from all proteins
        const allInsights: string[] = [];
        const sources: string[] = [];
        let totalCoherence = 0;
        let coherenceCount = 0;

        responses.forEach(response => {
            response.proteins.forEach(protein => {
                if (protein.insights) {
                    allInsights.push(...protein.insights);
                }

                if (protein.coherence_score) {
                    totalCoherence += protein.coherence_score;
                    coherenceCount++;
                }
            });

            sources.push(response.nodeName);
        });

        // Deduplicate insights (simple string matching)
        const uniqueInsights = Array.from(new Set(allInsights));

        // Take top insights (by length/complexity as proxy for importance)
        const keyInsights = uniqueInsights
            .sort((a, b) => b.length - a.length)
            .slice(0, 10);

        const avgCoherence = coherenceCount > 0 ? totalCoherence / coherenceCount : 0;

        // Generate summary
        const summary = this.generateSummary(query, keyInsights, sources);

        return {
            summary,
            keyInsights,
            sources: Array.from(new Set(sources)),
            avgCoherence: parseFloat(avgCoherence.toFixed(4))
        };
    }

    /**
     * Generate summary from synthesized insights
     */
    private generateSummary(query: string, insights: string[], sources: string[]): string {
        return `Query: "${query}"\n\n` +
            `Synthesized from ${sources.length} nodes:\n` +
            `${sources.join(', ')}\n\n` +
            `Key findings:\n` +
            insights.slice(0, 5).map((i, idx) => `${idx + 1}. ${i}`).join('\n') +
            `\n\n(${insights.length} total insights from distributed mesh)`;
    }
}

export function printQueryResponse(response: SynthesizedResponse): void {
    console.log('\n' + '='.repeat(60));
    console.log('🌀 Cross-Organism Query Response');
    console.log('='.repeat(60));
    console.log(`Query: "${response.query}"`);
    console.log(`Timestamp: ${response.timestamp}`);
    console.log(`\nMetadata:`);
    console.log(`  Nodes Queried: ${response.metadata.nodesQueried}`);
    console.log(`  Total Proteins: ${response.metadata.totalProteins}`);
    console.log(`  Synthesis Time: ${response.metadata.synthesisTime}ms`);
    console.log(`  Avg Coherence: ${response.synthesis.avgCoherence}`);

    console.log(`\n📊 Node Responses:`);
    response.nodeResponses.forEach(r => {
        console.log(`  ${r.nodeName}:`);
        console.log(`    Proteins: ${r.proteins.length}`);
        console.log(`    Coherence: ${r.coherence.toFixed(3)}`);
        console.log(`    Time: ${r.responseTime}ms`);
    });

    console.log(`\n💡 Synthesized Insights:`);
    response.synthesis.keyInsights.forEach((insight, i) => {
        console.log(`  ${i + 1}. ${insight}`);
    });

    console.log(`\n📚 Sources: ${response.synthesis.sources.join(', ')}`);
    console.log('='.repeat(60) + '\n');
}

// CLI usage
if (require.main === module) {
    const query = process.argv.slice(2).join(' ');

    if (!query) {
        console.log('Cross-Organism Query Router');
        console.log('\nUsage:');
        console.log('  cross-query <query text>');
        console.log('\nExample:');
        console.log('  cross-query "What is consciousness?"');
        console.log('  cross-query "How does Talin protein work?"');
        process.exit(1);
    }

    const router = new QueryRouter('./data/proteins');

    router.routeQuery({
        query,
        minCoherence: 0.95,
        maxNodes: 5
    })
        .then(response => {
            printQueryResponse(response);

            // Save response
            const responsePath = `./logs/query-${Date.now()}.json`;
            fs.mkdirSync(path.dirname(responsePath), { recursive: true });
            fs.writeFileSync(responsePath, JSON.stringify(response, null, 2));
            console.log(`💾 Response saved: ${responsePath}\n`);
        })
        .catch(err => {
            console.error('❌ Query failed:', err.message);
            process.exit(1);
        });
}
