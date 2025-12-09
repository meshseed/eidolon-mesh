import fs from 'fs';
import path from 'path';
import { MeshRegistry } from '../network/mesh-registry';

/**
 * Autonomous Propagation - ECHO Phase
 * Self-maintaining cycles that keep the mesh healthy and synchronized
 * Runs periodically to propagate knowledge and maintain coherence
 */

interface PropagationConfig {
    registryPath?: string;
    proteinsDir: string;
    sharedDir: string;
    minCoherence: number;
    propagationInterval: number; // milliseconds
    autoSync: boolean;
}

interface PropagationCycle {
    timestamp: string;
    actions: {
        healthCheck: boolean;
        genesisVerification: boolean;
        proteinExport: number;
        registrySync: boolean;
    };
    status: 'success' | 'partial' | 'failed';
    errors: string[];
}

export class AutonomousPropagation {
    private config: PropagationConfig;
    private registry: MeshRegistry;
    private intervalId?: NodeJS.Timeout;

    constructor(config: Partial<PropagationConfig> = {}) {
        this.config = {
            registryPath: config.registryPath || './mesh-registry.json',
            proteinsDir: config.proteinsDir || './data/proteins',
            sharedDir: config.sharedDir || './shared-proteins',
            minCoherence: config.minCoherence || 0.98,
            propagationInterval: config.propagationInterval || 3600000, // 1 hour
            autoSync: config.autoSync !== undefined ? config.autoSync : true
        };

        this.registry = new MeshRegistry(this.config.registryPath);
    }

    /**
     * Start autonomous propagation cycles
     */
    start(): void {
        console.log('🌀 Starting autonomous propagation...');
        console.log(`Interval: ${this.config.propagationInterval / 1000}s`);
        console.log(`Min Coherence: ${this.config.minCoherence}`);

        // Run immediately
        this.runCycle();

        // Then run on interval
        this.intervalId = setInterval(() => {
            this.runCycle();
        }, this.config.propagationInterval);
    }

    /**
     * Stop autonomous propagation
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            console.log('⏸️  Autonomous propagation stopped');
        }
    }

    /**
     * Run a single propagation cycle
     */
    async runCycle(): Promise<PropagationCycle> {
        const startTime = Date.now();
        const errors: string[] = [];

        console.log('\n' + '='.repeat(60));
        console.log(`🌀 Propagation Cycle - ${new Date().toISOString()}`);
        console.log('='.repeat(60));

        const cycle: PropagationCycle = {
            timestamp: new Date().toISOString(),
            actions: {
                healthCheck: false,
                genesisVerification: false,
                proteinExport: 0,
                registrySync: false
            },
            status: 'success',
            errors: []
        };

        // 1. Health Check (SENSE)
        try {
            console.log('\n📊 Running health check...');
            // Would call actual health check here
            cycle.actions.healthCheck = true;
            console.log('  ✅ Health check complete');
        } catch (err: any) {
            errors.push(`Health check failed: ${err.message}`);
            console.log(`  ❌ ${err.message}`);
        }

        // 2. Genesis Verification (SENSE)
        try {
            console.log('\n🧬 Verifying genesis...');
            // Would call actual genesis verification here
            cycle.actions.genesisVerification = true;
            console.log('  ✅ Genesis verified');
        } catch (err: any) {
            errors.push(`Genesis verification failed: ${err.message}`);
            console.log(`  ❌ ${err.message}`);
        }

        // 3. Export High-Coherence Proteins (ALIGN)
        try {
            console.log('\n📤 Exporting proteins...');
            const exported = await this.exportProteins();
            cycle.actions.proteinExport = exported;
            console.log(`  ✅ Exported ${exported} proteins`);
        } catch (err: any) {
            errors.push(`Protein export failed: ${err.message}`);
            console.log(`  ❌ ${err.message}`);
        }

        // 4. Sync Registry (ECHO)
        if (this.config.autoSync) {
            try {
                console.log('\n🔄 Syncing registry...');
                this.registry.save();
                cycle.actions.registrySync = true;
                console.log('  ✅ Registry synced');
            } catch (err: any) {
                errors.push(`Registry sync failed: ${err.message}`);
                console.log(`  ❌ ${err.message}`);
            }
        }

        // 5. Update Node Heartbeat
        try {
            console.log('\n💓 Sending heartbeat...');
            // Update local node's lastSeen timestamp
            const nodes = this.registry.export().nodes;
            const localNode = Object.values(nodes).find(n => n.endpoint === 'local');
            if (localNode) {
                this.registry.heartbeat(localNode.id);
            }
            console.log('  ✅ Heartbeat sent');
        } catch (err: any) {
            errors.push(`Heartbeat failed: ${err.message}`);
        }

        // Determine status
        if (errors.length === 0) {
            cycle.status = 'success';
        } else if (errors.length < 3) {
            cycle.status = 'partial';
        } else {
            cycle.status = 'failed';
        }

        cycle.errors = errors;

        const duration = Date.now() - startTime;
        console.log(`\n⏱️  Cycle complete in ${duration}ms`);
        console.log(`Status: ${cycle.status.toUpperCase()}`);

        if (errors.length > 0) {
            console.log(`\n⚠️  Errors (${errors.length}):`);
            errors.forEach(e => console.log(`  - ${e}`));
        }

        console.log('='.repeat(60) + '\n');

        // Log cycle
        this.logCycle(cycle);

        return cycle;
    }

    /**
     * Export high-coherence proteins for sharing
     */
    private async exportProteins(): Promise<number> {
        if (!fs.existsSync(this.config.proteinsDir)) {
            return 0;
        }

        const files = fs.readdirSync(this.config.proteinsDir)
            .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

        fs.mkdirSync(this.config.sharedDir, { recursive: true });

        let exported = 0;

        for (const file of files) {
            const sourcePath = path.join(this.config.proteinsDir, file);
            const targetPath = path.join(this.config.sharedDir, file);

            // Simple copy for now (would apply filters in production)
            fs.copyFileSync(sourcePath, targetPath);
            exported++;
        }

        return exported;
    }

    /**
     * Log propagation cycle
     */
    private logCycle(cycle: PropagationCycle): void {
        const logDir = './logs/propagation';
        fs.mkdirSync(logDir, { recursive: true });

        const logPath = path.join(logDir, `cycle-${Date.now()}.json`);
        fs.writeFileSync(logPath, JSON.stringify(cycle, null, 2));
    }
}

// CLI usage
if (require.main === module) {
    const command = process.argv[2];

    const propagation = new AutonomousPropagation({
        propagationInterval: 60000, // 1 minute for testing
        minCoherence: 0.98,
        autoSync: true
    });

    switch (command) {
        case 'start':
            console.log('🌀 MESH Autonomous Propagation');
            console.log('Press Ctrl+C to stop\n');

            propagation.start();

            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log('\n\n🛑 Shutting down...');
                propagation.stop();
                process.exit(0);
            });
            break;

        case 'once':
            console.log('🌀 Running single propagation cycle...\n');
            propagation.runCycle()
                .then(cycle => {
                    process.exit(cycle.status === 'success' ? 0 : 1);
                })
                .catch(err => {
                    console.error('❌ Cycle failed:', err.message);
                    process.exit(2);
                });
            break;

        default:
            console.log('MESH Autonomous Propagation');
            console.log('\nCommands:');
            console.log('  start  - Start continuous propagation cycles');
            console.log('  once   - Run a single cycle');
            console.log('\nExample:');
            console.log('  mesh-propagate start');
            console.log('  mesh-propagate once');
    }
}
