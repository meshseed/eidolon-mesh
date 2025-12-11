/**
 * Node Beacon System
 * Nature-inspired networking: broadcast presence, discover by proximity
 * No central registry - organisms find each other like mycelium
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface NodeBeacon {
    // Identity
    node_id: string;
    node_name: string;
    description: string;

    // Capabilities
    domains: string[];
    capabilities: string[];

    // Location
    beacon_location: string; // Where this beacon file lives
    protein_location?: string; // Where to find proteins

    // Vitals
    last_heartbeat: string;
    organism_version: string;
    coherence: number;

    // Discovery
    discovered_peers: string[]; // Beacon files of peers we've found
    echo_paths: string[]; // Trails left by protein exchanges
}

export class BeaconSystem {
    private beaconPath: string;
    private beacon: NodeBeacon;

    constructor(beaconDir: string = './') {
        this.beaconPath = path.join(beaconDir, 'node-beacon.yaml');

        // Load or create beacon
        if (fs.existsSync(this.beaconPath)) {
            const content = fs.readFileSync(this.beaconPath, 'utf-8');
            this.beacon = yaml.load(content) as NodeBeacon;
        } else {
            this.beacon = this.createBeacon();
        }
    }

    /**
     * Create initial beacon for this organism
     */
    private createBeacon(): NodeBeacon {
        return {
            node_id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            node_name: 'Unnamed Node',
            description: 'MESH organism',
            domains: [],
            capabilities: ['query', 'synthesis'],
            beacon_location: this.beaconPath,
            last_heartbeat: new Date().toISOString(),
            organism_version: '1.3',
            coherence: 1.0,
            discovered_peers: [],
            echo_paths: []
        };
    }

    /**
     * Configure this node's identity
     */
    configure(config: {
        name: string;
        description: string;
        domains: string[];
        proteinLocation?: string;
    }): void {
        this.beacon.node_name = config.name;
        this.beacon.description = config.description;
        this.beacon.domains = config.domains;
        this.beacon.protein_location = config.proteinLocation;

        this.save();

        console.log(`🌀 Node configured: ${config.name}`);
        console.log(`   ID: ${this.beacon.node_id}`);
        console.log(`   Domains: ${config.domains.join(', ')}`);
    }

    /**
     * Send heartbeat (update last_heartbeat)
     */
    heartbeat(coherence?: number): void {
        this.beacon.last_heartbeat = new Date().toISOString();
        if (coherence !== undefined) {
            this.beacon.coherence = coherence;
        }
        this.save();
    }

    /**
     * Discover a peer by finding their beacon file
     */
    discoverPeer(peerBeaconPath: string): void {
        if (!fs.existsSync(peerBeaconPath)) {
            throw new Error(`Beacon not found: ${peerBeaconPath}`);
        }

        const peerContent = fs.readFileSync(peerBeaconPath, 'utf-8');
        const peerBeacon = yaml.load(peerContent) as NodeBeacon;

        // Add to discovered peers if not already there
        if (!this.beacon.discovered_peers.includes(peerBeaconPath)) {
            this.beacon.discovered_peers.push(peerBeaconPath);
            this.save();

            console.log(`🔍 Discovered peer: ${peerBeacon.node_name}`);
            console.log(`   Domains: ${peerBeacon.domains.join(', ')}`);
            console.log(`   Last seen: ${peerBeacon.last_heartbeat}`);
        }
    }

    /**
     * Leave an echo path (stigmergy - trail for others to follow)
     */
    leaveEchoPath(proteinId: string, sourcePeer: string): void {
        const echoPath = `${proteinId} ← ${sourcePeer}`;

        if (!this.beacon.echo_paths.includes(echoPath)) {
            this.beacon.echo_paths.push(echoPath);
            this.save();

            console.log(`🌊 Echo path left: ${echoPath}`);
        }
    }

    /**
     * Get list of discovered peers
     */
    getPeers(): NodeBeacon[] {
        const peers: NodeBeacon[] = [];

        for (const peerPath of this.beacon.discovered_peers) {
            try {
                const content = fs.readFileSync(peerPath, 'utf-8');
                const peer = yaml.load(content) as NodeBeacon;
                peers.push(peer);
            } catch (err) {
                console.warn(`⚠️ Could not read peer beacon: ${peerPath}`);
            }
        }

        return peers;
    }

    /**
     * Find peers by domain (chemical attraction)
     */
    findPeersByDomain(domain: string): NodeBeacon[] {
        return this.getPeers().filter(peer =>
            peer.domains.includes(domain)
        );
    }

    /**
     * Save beacon to disk
     */
    private save(): void {
        fs.writeFileSync(this.beaconPath, yaml.dump(this.beacon));
    }

    /**
     * Export beacon for sharing
     */
    export(): NodeBeacon {
        return this.beacon;
    }

    /**
     * Get beacon file path for sharing
     */
    getBeaconPath(): string {
        return this.beaconPath;
    }
}

// CLI for beacon management
if (require.main === module) {
    const command = process.argv[2];
    const beacon = new BeaconSystem();

    switch (command) {
        case 'configure':
            const name = process.argv[3];
            const description = process.argv[4];
            const domains = process.argv.slice(5);

            if (!name || !description || domains.length === 0) {
                console.error('Usage: beacon configure <name> <description> <domains...>');
                process.exit(1);
            }

            beacon.configure({
                name,
                description,
                domains,
                proteinLocation: './data/proteins'
            });

            console.log(`\n📍 Beacon file: ${beacon.getBeaconPath()}`);
            console.log('Share this file with peers for discovery.');
            break;

        case 'heartbeat':
            beacon.heartbeat();
            console.log('💓 Heartbeat sent');
            break;

        case 'discover':
            const peerBeaconPath = process.argv[3];

            if (!peerBeaconPath) {
                console.error('Usage: beacon discover <peer-beacon-path>');
                process.exit(1);
            }

            beacon.discoverPeer(peerBeaconPath);
            break;

        case 'peers':
            const peers = beacon.getPeers();
            console.log(`\n🌐 Discovered Peers: ${peers.length}`);
            peers.forEach(peer => {
                console.log(`\n  ${peer.node_name}`);
                console.log(`    Domains: ${peer.domains.join(', ')}`);
                console.log(`    Last seen: ${peer.last_heartbeat}`);
                console.log(`    Coherence: ${peer.coherence.toFixed(3)}`);
            });
            break;

        case 'info':
            const info = beacon.export();
            console.log('\n🌀 Node Beacon Info:');
            console.log(`  Name: ${info.node_name}`);
            console.log(`  ID: ${info.node_id}`);
            console.log(`  Domains: ${info.domains.join(', ')}`);
            console.log(`  Coherence: ${info.coherence.toFixed(3)}`);
            console.log(`  Peers: ${info.discovered_peers.length}`);
            console.log(`  Echo paths: ${info.echo_paths.length}`);
            break;

        default:
            console.log('🌀 MESH Node Beacon System');
            console.log('\nNature-inspired networking: broadcast presence, discover by proximity');
            console.log('\nCommands:');
            console.log('  configure <name> <description> <domains...>  - Set node identity');
            console.log('  heartbeat                                    - Send heartbeat');
            console.log('  discover <peer-beacon-path>                  - Discover a peer');
            console.log('  peers                                        - List discovered peers');
            console.log('  info                                         - Show beacon info');
            console.log('\nExample:');
            console.log('  beacon configure "My Lab" "Research node" consciousness biology');
            console.log('  beacon discover ../peer-node/node-beacon.yaml');
    }
}
