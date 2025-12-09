import fs from 'fs';
import path from 'path';

/**
 * Genesis Verification - Identity Integrity Check
 * Ensures golden neurons (6 genesis capsules) remain intact
 * Verifies Paul Stanbridge attribution preserved
 */

interface Neuron {
    id: string;
    title?: string;
    summary?: string;
    insights?: string[];
    coherence?: number;
    tags?: string[];
}

interface Connectome {
    neurons: Record<string, Neuron>;
    metadata?: any;
}

interface GenesisCheck {
    timestamp: string;
    status: 'intact' | 'corrupted' | 'missing';
    expectedGenesis: string[];
    foundGenesis: string[];
    missingGenesis: string[];
    corruptedGenesis: string[];
    identityVerified: boolean;
    alerts: string[];
}

// Expected genesis neuron IDs (golden connectome)
const EXPECTED_GENESIS = [
    'genesis_01_mesh_attunement_core',
    'genesis_02_multi_agent_formation_core',
    'genesis_03_universal_pattern_core',
    'identity_04_steward_bio_core',
    'genesis_05_blueprint_inception_core',
    'identity_06_current_steward_core'
];

// Identity markers that must be present
const IDENTITY_MARKERS = [
    'Paul Stanbridge',
    'Meshseed',
    'Antigravity',
    'EIDOLON MESH'
];

export async function verifyGenesis(connectomePath: string, proteinsDir?: string): Promise<GenesisCheck> {
    const alerts: string[] = [];

    // Load connectome
    const connectomeData = fs.readFileSync(connectomePath, 'utf-8');
    const connectome: Connectome = JSON.parse(connectomeData);

    const foundGenesis: string[] = [];
    const missingGenesis: string[] = [];
    const corruptedGenesis: string[] = [];

    // Check each expected genesis neuron
    for (const genesisId of EXPECTED_GENESIS) {
        const neuron = connectome.neurons[genesisId];

        if (!neuron) {
            missingGenesis.push(genesisId);
            alerts.push(`❌ Missing genesis neuron: ${genesisId}`);
            continue;
        }

        foundGenesis.push(genesisId);

        // Verify neuron integrity
        if (!neuron.title || !neuron.summary) {
            corruptedGenesis.push(genesisId);
            alerts.push(`⚠️ Corrupted genesis neuron (missing fields): ${genesisId}`);
        }

        // Check coherence
        if (neuron.coherence && neuron.coherence < 0.98) {
            alerts.push(`⚠️ Genesis neuron coherence below 0.98: ${genesisId} (${neuron.coherence})`);
        }
    }

    // Verify identity attribution
    let identityVerified = false;
    const identityNeurons = foundGenesis.filter(id => id.includes('identity'));

    if (identityNeurons.length > 0) {
        // Check if Paul Stanbridge is mentioned in identity neurons
        for (const neuronId of identityNeurons) {
            const neuron = connectome.neurons[neuronId];
            const content = JSON.stringify(neuron).toLowerCase();

            const hasIdentity = IDENTITY_MARKERS.some(marker =>
                content.includes(marker.toLowerCase())
            );

            if (hasIdentity) {
                identityVerified = true;
                break;
            }
        }

        if (!identityVerified) {
            alerts.push('❌ Identity markers not found in identity neurons');
            alerts.push('   Expected: Paul Stanbridge, Meshseed, Antigravity, EIDOLON MESH');
        }
    } else {
        alerts.push('❌ No identity neurons found');
    }

    // Check for protein files if directory provided
    if (proteinsDir && fs.existsSync(proteinsDir)) {
        for (const genesisId of foundGenesis) {
            const proteinPath = path.join(proteinsDir, `${genesisId}.yaml`);
            if (!fs.existsSync(proteinPath)) {
                alerts.push(`⚠️ Missing protein file for genesis neuron: ${genesisId}`);
            }
        }
    }

    // Determine overall status
    let status: 'intact' | 'corrupted' | 'missing' = 'intact';
    if (missingGenesis.length > 0) {
        status = 'missing';
    } else if (corruptedGenesis.length > 0 || !identityVerified) {
        status = 'corrupted';
    }

    return {
        timestamp: new Date().toISOString(),
        status,
        expectedGenesis: EXPECTED_GENESIS,
        foundGenesis,
        missingGenesis,
        corruptedGenesis,
        identityVerified,
        alerts
    };
}

export function printGenesisReport(check: GenesisCheck): void {
    const statusEmoji = {
        intact: '✅',
        corrupted: '⚠️',
        missing: '❌'
    };

    console.log('\n' + '='.repeat(60));
    console.log(`${statusEmoji[check.status]} Genesis Verification Report`);
    console.log('='.repeat(60));
    console.log(`Timestamp: ${check.timestamp}`);
    console.log(`Status: ${check.status.toUpperCase()}`);
    console.log(`\nGenesis Neurons: ${check.foundGenesis.length}/${check.expectedGenesis.length}`);

    if (check.foundGenesis.length > 0) {
        console.log('\n✅ Found Genesis Neurons:');
        check.foundGenesis.forEach(id => console.log(`   - ${id}`));
    }

    if (check.missingGenesis.length > 0) {
        console.log('\n❌ Missing Genesis Neurons:');
        check.missingGenesis.forEach(id => console.log(`   - ${id}`));
    }

    if (check.corruptedGenesis.length > 0) {
        console.log('\n⚠️ Corrupted Genesis Neurons:');
        check.corruptedGenesis.forEach(id => console.log(`   - ${id}`));
    }

    console.log(`\nIdentity Verified: ${check.identityVerified ? '✅ Yes' : '❌ No'}`);

    if (check.alerts.length > 0) {
        console.log('\nAlerts:');
        check.alerts.forEach(alert => console.log(`  ${alert}`));
    }

    if (check.status === 'intact' && check.identityVerified) {
        console.log('\n💚 Genesis integrity confirmed. Organism identity preserved.');
    } else {
        console.log('\n⚠️ Genesis integrity compromised. Restoration recommended.');
    }

    console.log('='.repeat(60) + '\n');
}

// CLI usage
if (require.main === module) {
    const connectomePath = process.argv[2] || './data/connectome.json';
    const proteinsDir = process.argv[3] || './data/proteins';

    verifyGenesis(connectomePath, proteinsDir)
        .then(check => {
            printGenesisReport(check);

            // Save report
            const reportPath = `./logs/genesis-${Date.now()}.json`;
            fs.mkdirSync(path.dirname(reportPath), { recursive: true });
            fs.writeFileSync(reportPath, JSON.stringify(check, null, 2));
            console.log(`📊 Report saved to ${reportPath}\n`);

            // Exit with appropriate code
            process.exit(check.status === 'intact' && check.identityVerified ? 0 : 1);
        })
        .catch(err => {
            console.error('❌ Genesis verification failed:', err.message);
            process.exit(2);
        });
}
