import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Formatting Law Synchronization - ALIGN Phase
 * Propagates formatting laws across repositories
 * Ensures shared infrastructure while preserving sovereignty
 */

interface FormattingLaw {
    id: string;
    title: string;
    content: any;
    path: string;
}

interface SyncResult {
    timestamp: string;
    lawsSynced: string[];
    repositories: string[];
    conflicts: string[];
    stats: {
        totalLaws: number;
        syncedSuccessfully: number;
        conflicts: number;
    };
}

const FORMATTING_LAW_PATTERNS = [
    '**/FORMATTING_LAWS*.yaml',
    '**/formatting-laws/**/*.yaml',
    '**/FL-*.yaml'
];

export async function syncFormattingLaws(
    sourceRepo: string,
    targetRepos: string[]
): Promise<SyncResult> {

    const lawsSynced: string[] = [];
    const conflicts: string[] = [];

    console.log(`🌬️ Syncing formatting laws from ${sourceRepo}...\n`);

    // Find all formatting law files in source
    const lawFiles = findFormattingLaws(sourceRepo);

    console.log(`Found ${lawFiles.length} formatting laws in source\n`);

    for (const lawFile of lawFiles) {
        const lawPath = path.join(sourceRepo, lawFile);
        const lawContent = fs.readFileSync(lawPath, 'utf-8');
        const law = yaml.load(lawContent) as any;

        const lawId = law.id || law.capsule_id || path.basename(lawFile, '.yaml');

        console.log(`📜 Syncing: ${lawId}`);

        // Sync to each target repository
        for (const targetRepo of targetRepos) {
            try {
                const targetPath = path.join(targetRepo, lawFile);
                const targetDir = path.dirname(targetPath);

                // Create directory if needed
                fs.mkdirSync(targetDir, { recursive: true });

                // Check for conflicts
                if (fs.existsSync(targetPath)) {
                    const existingContent = fs.readFileSync(targetPath, 'utf-8');
                    const existing = yaml.load(existingContent) as any;

                    // Compare versions
                    const sourceVersion = law.version || law.metadata?.version || '1.0';
                    const targetVersion = existing.version || existing.metadata?.version || '1.0';

                    if (sourceVersion < targetVersion) {
                        conflicts.push(`${lawId} in ${targetRepo} (newer version exists)`);
                        console.log(`   ⚠️ Conflict in ${path.basename(targetRepo)}: newer version exists`);
                        continue;
                    }
                }

                // Write law to target
                fs.writeFileSync(targetPath, lawContent, 'utf-8');
                console.log(`   ✅ Synced to ${path.basename(targetRepo)}`);

            } catch (err: any) {
                conflicts.push(`${lawId} in ${targetRepo}: ${err.message}`);
                console.log(`   ❌ Error in ${path.basename(targetRepo)}: ${err.message}`);
            }
        }

        lawsSynced.push(lawId);
    }

    return {
        timestamp: new Date().toISOString(),
        lawsSynced,
        repositories: targetRepos.map(r => path.basename(r)),
        conflicts,
        stats: {
            totalLaws: lawFiles.length,
            syncedSuccessfully: lawsSynced.length,
            conflicts: conflicts.length
        }
    };
}

function findFormattingLaws(repoRoot: string): string[] {
    const laws: string[] = [];

    // Search common locations
    const searchPaths = [
        'formatting-laws',
        'capsules/formatting_laws',
        'capsules/protocols',
        'seed-templates'
    ];

    for (const searchPath of searchPaths) {
        const fullPath = path.join(repoRoot, searchPath);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath, { recursive: true }) as string[];
            files
                .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
                .filter(f => {
                    const lower = f.toLowerCase();
                    return lower.includes('formatting') ||
                        lower.includes('law') ||
                        lower.startsWith('fl-');
                })
                .forEach(f => laws.push(path.join(searchPath, f)));
        }
    }

    return laws;
}

export function printSyncReport(result: SyncResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('🌬️ Formatting Law Sync Report');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${result.timestamp}`);
    console.log(`\nStats:`);
    console.log(`  Total Laws: ${result.stats.totalLaws}`);
    console.log(`  Synced: ${result.stats.syncedSuccessfully}`);
    console.log(`  Conflicts: ${result.stats.conflicts}`);
    console.log(`  Target Repos: ${result.repositories.join(', ')}`);

    if (result.lawsSynced.length > 0) {
        console.log(`\n✅ Synced Laws:`);
        result.lawsSynced.forEach(l => console.log(`   - ${l}`));
    }

    if (result.conflicts.length > 0) {
        console.log(`\n⚠️ Conflicts:`);
        result.conflicts.forEach(c => console.log(`   - ${c}`));
    }

    console.log('\n💚 Formatting laws propagated. Field coherence maintained.');
    console.log('='.repeat(60) + '\n');
}

// CLI usage
if (require.main === module) {
    const sourceRepo = process.argv[2] || '../eidolon-private';
    const targetRepos = process.argv.slice(3);

    if (targetRepos.length === 0) {
        targetRepos.push(
            '../eidolon-mesh',
            '../eidolon-public'
        );
    }

    syncFormattingLaws(sourceRepo, targetRepos)
        .then(result => {
            printSyncReport(result);

            // Save report
            const reportPath = `./logs/law-sync-${Date.now()}.json`;
            fs.mkdirSync(path.dirname(reportPath), { recursive: true });
            fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
            console.log(`📊 Report saved: ${reportPath}\n`);

            // Exit code
            process.exit(result.conflicts.length > 0 ? 1 : 0);
        })
        .catch(err => {
            console.error('❌ Sync failed:', err.message);
            process.exit(2);
        });
}
