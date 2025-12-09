import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Protein Export Pipeline - ALIGN Phase
 * Exports high-coherence proteins from private → public repositories
 * Implements selective permeability (membrane function)
 */

interface Protein {
    id: string;
    title: string;
    summary: string;
    insights: string[];
    tags?: string[];
    coherence_score?: number;
    domain?: string;
    breath_type?: string;
    [key: string]: any;
}

interface ExportConfig {
    sourceDir: string;
    targetDir: string;
    minCoherence: number;
    requirePublicTag: boolean;
    preserveLineage: boolean;
}

interface ExportResult {
    timestamp: string;
    exported: string[];
    skipped: string[];
    errors: string[];
    stats: {
        totalScanned: number;
        totalExported: number;
        avgCoherence: number;
    };
}

const DEFAULT_CONFIG: ExportConfig = {
    sourceDir: './data/proteins',
    targetDir: '../eidolon-mesh/data/proteins',
    minCoherence: 0.98,
    requirePublicTag: true,
    preserveLineage: true
};

export async function exportProteins(config: Partial<ExportConfig> = {}): Promise<ExportResult> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    const exported: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];
    let totalCoherence = 0;
    let coherenceCount = 0;

    // Ensure target directory exists
    fs.mkdirSync(cfg.targetDir, { recursive: true });

    // Scan source directory
    const files = fs.readdirSync(cfg.sourceDir)
        .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

    console.log(`📊 Scanning ${files.length} proteins in ${cfg.sourceDir}...\n`);

    for (const file of files) {
        const sourcePath = path.join(cfg.sourceDir, file);

        try {
            // Load protein
            const content = fs.readFileSync(sourcePath, 'utf-8');
            const protein = yaml.load(content) as Protein;

            // Check coherence threshold
            const coherence = protein.coherence_score || 1.0;
            if (coherence < cfg.minCoherence) {
                skipped.push(`${file} (coherence ${coherence.toFixed(3)} < ${cfg.minCoherence})`);
                continue;
            }

            // Check for #public tag if required
            if (cfg.requirePublicTag) {
                const tags = protein.tags || [];
                const hasPublicTag = tags.some(tag =>
                    tag.toLowerCase().includes('public') || tag === '#public'
                );

                if (!hasPublicTag) {
                    skipped.push(`${file} (missing #public tag)`);
                    continue;
                }
            }

            // Add export metadata
            if (cfg.preserveLineage) {
                protein.export_metadata = {
                    exported_at: new Date().toISOString(),
                    source_repository: 'eidolon-private',
                    target_repository: 'eidolon-mesh',
                    export_coherence: coherence
                };
            }

            // Write to target
            const targetPath = path.join(cfg.targetDir, file);
            fs.writeFileSync(targetPath, yaml.dump(protein), 'utf-8');

            exported.push(file);
            totalCoherence += coherence;
            coherenceCount++;

            console.log(`✅ Exported: ${file} (coherence: ${coherence.toFixed(3)})`);

        } catch (err: any) {
            errors.push(`${file}: ${err.message}`);
            console.error(`❌ Error: ${file} - ${err.message}`);
        }
    }

    const avgCoherence = coherenceCount > 0 ? totalCoherence / coherenceCount : 0;

    return {
        timestamp: new Date().toISOString(),
        exported,
        skipped,
        errors,
        stats: {
            totalScanned: files.length,
            totalExported: exported.length,
            avgCoherence: parseFloat(avgCoherence.toFixed(4))
        }
    };
}

export function printExportReport(result: ExportResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('🌀 Protein Export Report - ALIGN Phase');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${result.timestamp}`);
    console.log(`\nStats:`);
    console.log(`  Scanned: ${result.stats.totalScanned} proteins`);
    console.log(`  Exported: ${result.stats.totalExported} proteins`);
    console.log(`  Skipped: ${result.skipped.length} proteins`);
    console.log(`  Errors: ${result.errors.length}`);
    console.log(`  Avg Coherence: ${result.stats.avgCoherence}`);

    if (result.exported.length > 0) {
        console.log(`\n✅ Exported Proteins:`);
        result.exported.forEach(p => console.log(`   - ${p}`));
    }

    if (result.skipped.length > 0 && result.skipped.length <= 10) {
        console.log(`\n⏭️  Skipped:`);
        result.skipped.forEach(s => console.log(`   - ${s}`));
    } else if (result.skipped.length > 10) {
        console.log(`\n⏭️  Skipped: ${result.skipped.length} proteins (coherence/tag filters)`);
    }

    if (result.errors.length > 0) {
        console.log(`\n❌ Errors:`);
        result.errors.forEach(e => console.log(`   - ${e}`));
    }

    console.log('\n💚 Protein flow complete. Cytoplasm updated.');
    console.log('='.repeat(60) + '\n');
}

// CLI usage
if (require.main === module) {
    const sourceDir = process.argv[2] || './data/proteins';
    const targetDir = process.argv[3] || '../eidolon-mesh/data/proteins';
    const minCoherence = parseFloat(process.argv[4] || '0.98');

    exportProteins({
        sourceDir,
        targetDir,
        minCoherence,
        requirePublicTag: true,
        preserveLineage: true
    })
        .then(result => {
            printExportReport(result);

            // Save report
            const reportPath = `./logs/export-${Date.now()}.json`;
            fs.mkdirSync(path.dirname(reportPath), { recursive: true });
            fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
            console.log(`📊 Report saved: ${reportPath}\n`);

            // Exit code
            process.exit(result.errors.length > 0 ? 1 : 0);
        })
        .catch(err => {
            console.error('❌ Export failed:', err.message);
            process.exit(2);
        });
}
