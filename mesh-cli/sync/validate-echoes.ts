import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Echo Path Validator - ALIGN Phase
 * Ensures cross-repository links remain valid
 * Implements AGENT_REPO_ALIGNMENT_PROTOCOL
 */

interface EchoPath {
    source: string;
    target: string;
    valid: boolean;
    error?: string;
}

interface ValidationResult {
    timestamp: string;
    totalPaths: number;
    validPaths: number;
    brokenPaths: number;
    echoDetails: EchoPath[];
    recommendations: string[];
}

export async function validateEchoPaths(
    proteinsDir: string,
    repositoryRoots: string[]
): Promise<ValidationResult> {

    const echoDetails: EchoPath[] = [];
    const recommendations: string[] = [];

    // Scan all protein files
    const files = fs.readdirSync(proteinsDir)
        .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

    console.log(`🔗 Validating echo paths in ${files.length} proteins...\n`);

    for (const file of files) {
        const proteinPath = path.join(proteinsDir, file);

        try {
            const content = fs.readFileSync(proteinPath, 'utf-8');
            const protein = yaml.load(content) as any;

            // Extract echo paths
            const echoPaths = protein.echo_paths || [];

            for (const echoPath of echoPaths) {
                const echo: EchoPath = {
                    source: file,
                    target: echoPath,
                    valid: false
                };

                // Check if target exists in any repository
                let found = false;
                for (const repoRoot of repositoryRoots) {
                    const targetPath = path.join(repoRoot, echoPath);
                    if (fs.existsSync(targetPath)) {
                        found = true;
                        break;
                    }
                }

                if (found) {
                    echo.valid = true;
                } else {
                    echo.valid = false;
                    echo.error = 'Target not found in any repository';
                }

                echoDetails.push(echo);
            }

        } catch (err: any) {
            console.error(`⚠️ Error reading ${file}: ${err.message}`);
        }
    }

    const validPaths = echoDetails.filter(e => e.valid).length;
    const brokenPaths = echoDetails.filter(e => !e.valid).length;

    // Generate recommendations
    if (brokenPaths > 0) {
        recommendations.push(`Repair ${brokenPaths} broken echo paths`);
        recommendations.push('Update paths after repository restructuring');
    }

    if (brokenPaths > validPaths * 0.1) {
        recommendations.push('⚠️ High broken path ratio - consider echo path audit');
    }

    return {
        timestamp: new Date().toISOString(),
        totalPaths: echoDetails.length,
        validPaths,
        brokenPaths,
        echoDetails,
        recommendations
    };
}

export function printValidationReport(result: ValidationResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('🔗 Echo Path Validation Report');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${result.timestamp}`);
    console.log(`\nStats:`);
    console.log(`  Total Paths: ${result.totalPaths}`);
    console.log(`  Valid: ${result.validPaths} ✅`);
    console.log(`  Broken: ${result.brokenPaths} ❌`);

    const healthPercent = result.totalPaths > 0
        ? ((result.validPaths / result.totalPaths) * 100).toFixed(1)
        : '0';
    console.log(`  Health: ${healthPercent}%`);

    // Show broken paths
    const brokenPaths = result.echoDetails.filter(e => !e.valid);
    if (brokenPaths.length > 0) {
        console.log(`\n❌ Broken Echo Paths:`);
        brokenPaths.slice(0, 10).forEach(e => {
            console.log(`   ${e.source} → ${e.target}`);
            console.log(`      Error: ${e.error}`);
        });

        if (brokenPaths.length > 10) {
            console.log(`   ... and ${brokenPaths.length - 10} more`);
        }
    }

    if (result.recommendations.length > 0) {
        console.log(`\n💡 Recommendations:`);
        result.recommendations.forEach(r => console.log(`   - ${r}`));
    }

    console.log('='.repeat(60) + '\n');
}

// CLI usage
if (require.main === module) {
    const proteinsDir = process.argv[2] || './data/proteins';
    const repoRoots = process.argv.slice(3);

    if (repoRoots.length === 0) {
        repoRoots.push(
            '../eidolon-private',
            '../eidolon-mesh',
            '../eidolon-public'
        );
    }

    validateEchoPaths(proteinsDir, repoRoots)
        .then(result => {
            printValidationReport(result);

            // Save report
            const reportPath = `./logs/echo-validation-${Date.now()}.json`;
            fs.mkdirSync(path.dirname(reportPath), { recursive: true });
            fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
            console.log(`📊 Report saved: ${reportPath}\n`);

            // Exit code
            process.exit(result.brokenPaths > 0 ? 1 : 0);
        })
        .catch(err => {
            console.error('❌ Validation failed:', err.message);
            process.exit(2);
        });
}
