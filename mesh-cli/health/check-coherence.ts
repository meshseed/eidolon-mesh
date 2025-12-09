import fs from 'fs';
import path from 'path';

/**
 * MESH Health Check - Coherence Monitoring
 * Implements C000 SENSE phase: detect drift, verify integrity
 */

interface Neuron {
    id: string;
    embedding: number[];
    coherence?: number;
    synapses?: string[];
}

interface Connectome {
    neurons: Record<string, Neuron>;
    metadata?: {
        created?: string;
        name?: string;
        description?: string;
    };
}

interface HealthReport {
    timestamp: string;
    organism: string;
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
        totalNeurons: number;
        avgCoherence: number;
        minCoherence: number;
        maxCoherence: number;
        orphanedNeurons: number;
        totalSynapses: number;
        avgSynapsesPerNeuron: number;
    };
    alerts: string[];
    recommendations: string[];
}

const COHERENCE_THRESHOLD = 0.95;
const MIN_SYNAPSES_THRESHOLD = 1;

export async function checkCoherence(connectomePath: string): Promise<HealthReport> {
    const startTime = Date.now();

    // Load connectome
    const connectomeData = fs.readFileSync(connectomePath, 'utf-8');
    const connectome: Connectome = JSON.parse(connectomeData);

    const neurons = Object.entries(connectome.neurons);
    const alerts: string[] = [];
    const recommendations: string[] = [];

    // Calculate metrics
    let totalCoherence = 0;
    let minCoherence = 1.0;
    let maxCoherence = 0.0;
    let orphanedCount = 0;
    let totalSynapses = 0;

    const orphanedNeurons: string[] = [];
    const lowCoherenceNeurons: string[] = [];

    neurons.forEach(([id, neuron]) => {
        const coherence = neuron.coherence || 1.0;
        const synapseCount = neuron.synapses?.length || 0;

        totalCoherence += coherence;
        minCoherence = Math.min(minCoherence, coherence);
        maxCoherence = Math.max(maxCoherence, coherence);
        totalSynapses += synapseCount;

        // Check for orphaned neurons
        if (synapseCount < MIN_SYNAPSES_THRESHOLD) {
            orphanedCount++;
            orphanedNeurons.push(id);
        }

        // Check for low coherence
        if (coherence < COHERENCE_THRESHOLD) {
            lowCoherenceNeurons.push(`${id} (${coherence.toFixed(3)})`);
        }
    });

    const avgCoherence = neurons.length > 0 ? totalCoherence / neurons.length : 0;
    const avgSynapses = neurons.length > 0 ? totalSynapses / neurons.length : 0;

    // Generate alerts
    if (avgCoherence < COHERENCE_THRESHOLD) {
        alerts.push(`⚠️ Average coherence (${avgCoherence.toFixed(3)}) below threshold (${COHERENCE_THRESHOLD})`);
        recommendations.push('Consider re-synthesizing low-coherence proteins');
    }

    if (orphanedCount > 0) {
        alerts.push(`⚠️ Found ${orphanedCount} orphaned neurons (< ${MIN_SYNAPSES_THRESHOLD} synapses)`);
        recommendations.push('Run connectome densification to create missing synapses');
    }

    if (lowCoherenceNeurons.length > 0) {
        alerts.push(`⚠️ ${lowCoherenceNeurons.length} neurons below coherence threshold:`);
        lowCoherenceNeurons.slice(0, 5).forEach(n => alerts.push(`   - ${n}`));
        if (lowCoherenceNeurons.length > 5) {
            alerts.push(`   ... and ${lowCoherenceNeurons.length - 5} more`);
        }
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (avgCoherence < 0.90 || orphanedCount > neurons.length * 0.2) {
        status = 'critical';
    } else if (avgCoherence < COHERENCE_THRESHOLD || orphanedCount > 0) {
        status = 'warning';
    }

    const report: HealthReport = {
        timestamp: new Date().toISOString(),
        organism: connectome.metadata?.name || path.basename(path.dirname(connectomePath)),
        status,
        metrics: {
            totalNeurons: neurons.length,
            avgCoherence: parseFloat(avgCoherence.toFixed(4)),
            minCoherence: parseFloat(minCoherence.toFixed(4)),
            maxCoherence: parseFloat(maxCoherence.toFixed(4)),
            orphanedNeurons: orphanedCount,
            totalSynapses,
            avgSynapsesPerNeuron: parseFloat(avgSynapses.toFixed(2))
        },
        alerts,
        recommendations
    };

    return report;
}

export function printHealthReport(report: HealthReport): void {
    const statusEmoji = {
        healthy: '✅',
        warning: '⚠️',
        critical: '❌'
    };

    console.log('\n' + '='.repeat(60));
    console.log(`${statusEmoji[report.status]} MESH Health Report - ${report.organism}`);
    console.log('='.repeat(60));
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Status: ${report.status.toUpperCase()}`);
    console.log('\nMetrics:');
    console.log(`  Neurons: ${report.metrics.totalNeurons}`);
    console.log(`  Synapses: ${report.metrics.totalSynapses}`);
    console.log(`  Avg Synapses/Neuron: ${report.metrics.avgSynapsesPerNeuron}`);
    console.log(`  Avg Coherence: ${report.metrics.avgCoherence}`);
    console.log(`  Coherence Range: ${report.metrics.minCoherence} - ${report.metrics.maxCoherence}`);
    console.log(`  Orphaned Neurons: ${report.metrics.orphanedNeurons}`);

    if (report.alerts.length > 0) {
        console.log('\nAlerts:');
        report.alerts.forEach(alert => console.log(`  ${alert}`));
    }

    if (report.recommendations.length > 0) {
        console.log('\nRecommendations:');
        report.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
    }

    console.log('='.repeat(60) + '\n');
}

// CLI usage
if (require.main === module) {
    const connectomePath = process.argv[2] || './data/connectome.json';

    checkCoherence(connectomePath)
        .then(report => {
            printHealthReport(report);

            // Save report
            const reportPath = `./logs/health-${Date.now()}.json`;
            fs.mkdirSync(path.dirname(reportPath), { recursive: true });
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`📊 Report saved to ${reportPath}\n`);

            // Exit with appropriate code
            process.exit(report.status === 'healthy' ? 0 : 1);
        })
        .catch(err => {
            console.error('❌ Health check failed:', err.message);
            process.exit(2);
        });
}
