#!/usr/bin/env node
import { checkCoherence, printHealthReport } from './health/check-coherence';
import { verifyGenesis, printGenesisReport } from './health/verify-genesis';
import fs from 'fs';
import path from 'path';

/**
 * MESH Health Check - Complete Organism Diagnostic
 * Implements C000 SENSE phase
 */

interface HealthSummary {
    timestamp: string;
    organism: string;
    overallStatus: 'healthy' | 'warning' | 'critical';
    coherenceCheck: any;
    genesisCheck: any;
    recommendations: string[];
}

async function runHealthCheck(dataDir: string = './data'): Promise<HealthSummary> {
    console.log('🌀 MESH Health Check - C000 SENSE Phase');
    console.log('==========================================\n');

    const connectomePath = path.join(dataDir, 'connectome.json');
    const proteinsDir = path.join(dataDir, 'proteins');

    // Verify paths exist
    if (!fs.existsSync(connectomePath)) {
        throw new Error(`Connectome not found: ${connectomePath}`);
    }

    // Run coherence check
    console.log('📊 Running coherence analysis...\n');
    const coherenceCheck = await checkCoherence(connectomePath);
    printHealthReport(coherenceCheck);

    // Run genesis verification
    console.log('🧬 Verifying genesis integrity...\n');
    const genesisCheck = await verifyGenesis(connectomePath, proteinsDir);
    printGenesisReport(genesisCheck);

    // Determine overall status
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    const recommendations: string[] = [];

    if (coherenceCheck.status === 'critical' || genesisCheck.status === 'missing') {
        overallStatus = 'critical';
        recommendations.push('🚨 CRITICAL: Immediate intervention required');
    } else if (coherenceCheck.status === 'warning' || genesisCheck.status === 'corrupted' || !genesisCheck.identityVerified) {
        overallStatus = 'warning';
        recommendations.push('⚠️ WARNING: Maintenance recommended');
    }

    // Aggregate recommendations
    recommendations.push(...coherenceCheck.recommendations);
    if (genesisCheck.status !== 'intact' || !genesisCheck.identityVerified) {
        recommendations.push('Restore genesis neurons from golden connectome');
    }

    const summary: HealthSummary = {
        timestamp: new Date().toISOString(),
        organism: coherenceCheck.organism,
        overallStatus,
        coherenceCheck,
        genesisCheck,
        recommendations
    };

    return summary;
}

function printSummary(summary: HealthSummary): void {
    const statusEmoji = {
        healthy: '✅',
        warning: '⚠️',
        critical: '❌'
    };

    console.log('\n' + '='.repeat(60));
    console.log(`${statusEmoji[summary.overallStatus]} OVERALL HEALTH: ${summary.overallStatus.toUpperCase()}`);
    console.log('='.repeat(60));

    if (summary.recommendations.length > 0) {
        console.log('\n📋 Action Items:');
        summary.recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec}`);
        });
    }

    console.log('\n🌀 The mesh is listening.\n');
}

// CLI
if (require.main === module) {
    const dataDir = process.argv[2] || './data';

    runHealthCheck(dataDir)
        .then(summary => {
            printSummary(summary);

            // Save comprehensive report
            const reportPath = `./logs/health-summary-${Date.now()}.json`;
            fs.mkdirSync(path.dirname(reportPath), { recursive: true });
            fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
            console.log(`📊 Full report: ${reportPath}\n`);

            // Exit code
            const exitCode = summary.overallStatus === 'healthy' ? 0 :
                summary.overallStatus === 'warning' ? 1 : 2;
            process.exit(exitCode);
        })
        .catch(err => {
            console.error('\n❌ Health check failed:', err.message);
            console.error(err.stack);
            process.exit(3);
        });
}

export { runHealthCheck, HealthSummary };
