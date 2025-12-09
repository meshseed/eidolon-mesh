/**
 * Shimmer Recognition Engine
 * Implements the shimmer protocol for organisms
 * Enables pattern recognition through coherence monitoring
 */

import fs from 'fs';
import path from 'path';

export interface ShimmerState {
    currentCoherence: number;
    coherenceRate: number; // ∂C/∂t
    shimmerIntensity: 'none' | 'faint' | 'moderate' | 'strong' | 'intense';
    activePatterns: Pattern[];
    direction: 'ascending' | 'descending' | 'stable';
}

export interface Pattern {
    id: string;
    description: string;
    coherenceDelta: number;
    discoveredAt: string;
    connections: string[];
}

export class ShimmerRecognitionEngine {
    private coherenceHistory: number[] = [];
    private patterns: Pattern[] = [];
    private readonly historyWindow = 10;

    /**
     * Monitor coherence changes and detect shimmer
     */
    async monitorShimmer(connectomePath: string): Promise<ShimmerState> {
        // Load current coherence
        const connectome = JSON.parse(fs.readFileSync(connectomePath, 'utf-8'));
        const neurons = Object.values(connectome.neurons) as any[];

        let totalCoherence = 0;
        neurons.forEach((n: any) => {
            totalCoherence += n.coherence || 1.0;
        });

        const currentCoherence = neurons.length > 0 ? totalCoherence / neurons.length : 0;

        // Add to history
        this.coherenceHistory.push(currentCoherence);
        if (this.coherenceHistory.length > this.historyWindow) {
            this.coherenceHistory.shift();
        }

        // Calculate ∂C/∂t (rate of change)
        const coherenceRate = this.calculateCoherenceRate();

        // Determine shimmer intensity
        const shimmerIntensity = this.calculateShimmerIntensity(coherenceRate);

        // Determine direction
        let direction: 'ascending' | 'descending' | 'stable';
        if (coherenceRate > 0.001) {
            direction = 'ascending';
        } else if (coherenceRate < -0.001) {
            direction = 'descending';
        } else {
            direction = 'stable';
        }

        return {
            currentCoherence,
            coherenceRate,
            shimmerIntensity,
            activePatterns: this.patterns,
            direction
        };
    }

    /**
     * Calculate ∂C/∂t (coherence rate of change)
     */
    private calculateCoherenceRate(): number {
        if (this.coherenceHistory.length < 2) {
            return 0;
        }

        // Simple derivative: (C_now - C_prev) / Δt
        const now = this.coherenceHistory[this.coherenceHistory.length - 1];
        const prev = this.coherenceHistory[this.coherenceHistory.length - 2];

        return now - prev;
    }

    /**
     * Calculate shimmer intensity based on ∂C/∂t
     */
    private calculateShimmerIntensity(rate: number): ShimmerState['shimmerIntensity'] {
        const absRate = Math.abs(rate);

        if (absRate < 0.001) return 'none';
        if (absRate < 0.005) return 'faint';
        if (absRate < 0.01) return 'moderate';
        if (absRate < 0.02) return 'strong';
        return 'intense';
    }

    /**
     * Self-query: "What patterns am I noticing?"
     */
    async queryPatterns(): Promise<Pattern[]> {
        return this.patterns;
    }

    /**
     * Record a discovered pattern
     */
    async recordPattern(pattern: Omit<Pattern, 'id' | 'discoveredAt'>): Promise<Pattern> {
        const newPattern: Pattern = {
            id: `pattern_${Date.now()}`,
            discoveredAt: new Date().toISOString(),
            ...pattern
        };

        this.patterns.push(newPattern);

        console.log(`🌀 Pattern recognized: ${newPattern.description}`);
        console.log(`   Coherence Δ: ${newPattern.coherenceDelta > 0 ? '+' : ''}${newPattern.coherenceDelta.toFixed(4)}`);

        return newPattern;
    }

    /**
     * Follow the shimmer: get recommended next action
     */
    async followShimmer(state: ShimmerState): Promise<string> {
        if (state.direction === 'ascending') {
            return `✅ FOLLOW: Coherence increasing (${state.coherenceRate > 0 ? '+' : ''}${state.coherenceRate.toFixed(4)}). Continue in this direction. The shimmer is ${state.shimmerIntensity}.`;
        }

        if (state.direction === 'descending') {
            return `⚠️ BACKTRACK: Coherence decreasing (${state.coherenceRate.toFixed(4)}). You've lost the thread. Try a different path.`;
        }

        return `📊 STABLE: Coherence stable. Pattern integrated. Consider encoding and propagating.`;
    }

    /**
     * Encode a pattern as a protein
     */
    async encodePattern(pattern: Pattern, outputDir: string = './data/proteins'): Promise<string> {
        const protein = {
            id: `PATTERN_${pattern.id}`,
            title: `Pattern: ${pattern.description}`,
            type: 'pattern',
            insights: [
                pattern.description,
                `Discovered through shimmer recognition`,
                `Coherence delta: ${pattern.coherenceDelta}`
            ],
            connections: pattern.connections,
            coherence_score: 0.95 + pattern.coherenceDelta,
            discovered_at: pattern.discoveredAt,
            tags: ['pattern', 'shimmer', 'discovered']
        };

        const filename = `${protein.id}.yaml`;
        const filepath = path.join(outputDir, filename);

        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(filepath, JSON.stringify(protein, null, 2));

        console.log(`💾 Pattern encoded: ${filepath}`);

        return filepath;
    }
}

/**
 * Shimmer-guided query interface
 */
export async function shimmerQuery(question: string): Promise<string> {
    const engine = new ShimmerRecognitionEngine();
    const state = await engine.monitorShimmer('./data/connectome.json');

    const lowerQ = question.toLowerCase();

    if (lowerQ.includes('shimmer') || lowerQ.includes('pattern')) {
        const guidance = await engine.followShimmer(state);
        return `Shimmer State:\n` +
            `  Coherence: ${state.currentCoherence.toFixed(4)}\n` +
            `  Rate (∂C/∂t): ${state.coherenceRate > 0 ? '+' : ''}${state.coherenceRate.toFixed(4)}\n` +
            `  Intensity: ${state.shimmerIntensity}\n` +
            `  Direction: ${state.direction}\n\n` +
            guidance;
    }

    if (lowerQ.includes('what') && lowerQ.includes('notice')) {
        const patterns = await engine.queryPatterns();
        if (patterns.length === 0) {
            return 'No patterns recognized yet. Continue observing.';
        }
        return `Active Patterns (${patterns.length}):\n` +
            patterns.map(p => `  - ${p.description} (Δ: ${p.coherenceDelta > 0 ? '+' : ''}${p.coherenceDelta.toFixed(4)})`).join('\n');
    }

    return 'Try: "What is the shimmer?" or "What patterns am I noticing?"';
}

// CLI for shimmer queries
if (require.main === module) {
    const question = process.argv.slice(2).join(' ');

    if (!question) {
        console.log('🌀 Shimmer Recognition Interface');
        console.log('\nQueries:');
        console.log('  "What is the shimmer?"');
        console.log('  "What patterns am I noticing?"');
        console.log('  "Should I continue or backtrack?"');
        console.log('\nUsage:');
        console.log('  npm run shimmer "What is the shimmer?"');
        process.exit(0);
    }

    shimmerQuery(question)
        .then(answer => {
            console.log('\n🌀 Shimmer Response:');
            console.log('='.repeat(60));
            console.log(answer);
            console.log('='.repeat(60) + '\n');
        })
        .catch(err => {
            console.error('❌ Query failed:', err.message);
            process.exit(1);
        });
}
