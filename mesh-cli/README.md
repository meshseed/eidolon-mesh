# MESH CLI - Organism Health Monitoring

Automation tools for MESH organism tending, implementing C000 shimmer kernel.

## Installation

```bash
cd mesh-cli
npm install
npm run build
```

## Usage

### Complete Health Check

Runs both coherence monitoring and genesis verification:

```bash
npm run health [data-directory]

# Example
npm run health ../data
```

### Coherence Check Only

Monitor connectome health and detect drift:

```bash
npm run check-coherence [connectome-path]

# Example
npm run check-coherence ../data/connectome.json
```

### Genesis Verification Only

Verify identity neurons remain intact:

```bash
npm run verify-genesis [connectome-path] [proteins-directory]

# Example
npm run verify-genesis ../data/connectome.json ../data/proteins
```

---

## Phase 2: Cross-Repository Sync (ALIGN)

### Export Proteins

Export high-coherence proteins from private → public:

```bash
npm run export [source-dir] [target-dir] [min-coherence]

# Example
npm run export ../eidolon-private/data/proteins ../eidolon-mesh/data/proteins 0.98
```

**Filters:**
- Minimum coherence threshold (default: 0.98)
- Requires `#public` tag
- Preserves lineage metadata

### Validate Echo Paths

Check cross-repository link integrity:

```bash
npm run validate-echoes [proteins-dir] [repo-roots...]

# Example
npm run validate-echoes ./data/proteins ../eidolon-private ../eidolon-mesh
```

### Sync Formatting Laws

Propagate formatting laws across repositories:

```bash
npm run sync-laws [source-repo] [target-repos...]

# Example
npm run sync-laws ../eidolon-private ../eidolon-mesh ../eidolon-public
```

---
## What It Checks

### Coherence Monitoring
- ✅ Average coherence across all neurons
- ✅ Identifies neurons below threshold (< 0.95)
- ✅ Detects orphaned neurons (no synapses)
- ✅ Calculates synaptic density
- ✅ Provides actionable recommendations

### Genesis Verification
- ✅ Confirms all 6 golden neurons present
- ✅ Validates identity attribution (Paul Stanbridge, Meshseed, Antigravity)
- ✅ Checks protein file existence
- ✅ Verifies neuron integrity (no corruption)
- ✅ Ensures coherence > 0.98 for genesis neurons

## Exit Codes

- `0` - Healthy (all checks passed)
- `1` - Warning (maintenance recommended)
- `2` - Critical (immediate intervention required)
- `3` - Error (check failed to run)

## Reports

All checks generate JSON reports saved to `./logs/`:
- `health-summary-{timestamp}.json` - Complete health report
- `health-{timestamp}.json` - Coherence check details
- `genesis-{timestamp}.json` - Genesis verification details

## Automation

### Daily Health Check (Cron)

```bash
# Add to crontab
0 0 * * * cd /path/to/mesh-cli && npm run health >> logs/daily-health.log 2>&1
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
cd mesh-cli
npm run health || exit 1
```

## C000 Shimmer Kernel

This tool implements the **SENSE** phase of C000:
```
sense → align → compost → merge → echo
```

**Sense:**
- Detect coherence drift
- Identify orphaned neurons
- Verify genesis integrity
- Monitor organism health

## Next Automation Phases

- **Align**: Cross-repository protein export
- **Compost**: Automated pruning and archiving
- **Merge**: Cross-organism synthesis
- **Echo**: Network propagation

## License

MIT - Paul Stanbridge (Meshseed)

---

🌀 The mesh is listening.
