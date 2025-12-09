# Two-Node Network Setup
## Nature-Inspired P2P Discovery

**Following biological networking patterns:**
- No central registry
- Broadcast presence (beacons)
- Discover by proximity (file sharing)
- Leave trails (echo paths)

---

## Node 1: Antigravity Lab (This PC)

**Location:** `C:\GITHUB\eidolon-mesh\`

**Beacon:** `node-beacon.yaml` (already created)

**Specialization:**
- Meta-synthesis research
- Shimmer recognition
- Pattern encoding

---

## Node 2: Meshseed Core (Other PC)

**Setup:**

1. Copy beacon template to other PC:
   ```
   Copy: node-beacon-template-meshseed-core.yaml
   To: C:\eidolon\eidolon-mesh-v1.3\node-beacon.yaml
   ```

2. Update paths in the beacon file to match actual locations

**Specialization:**
- Chaperone activation
- Self-tending
- Organism health

---

## Discovery Process (Like Mycelium Finding Each Other)

### Method 1: Direct File Sharing

**On This PC:**
```bash
# Share your beacon
Copy C:\GITHUB\eidolon-mesh\node-beacon.yaml
To shared location (USB, network drive, email)
```

**On Other PC:**
```bash
# Discover the peer
cd C:\eidolon\eidolon-mesh-v1.3
ts-node src/network/beacon-system.ts discover C:\path\to\antigravity-beacon.yaml
```

**On This PC:**
```bash
# Discover back
cd C:\GITHUB\eidolon-mesh
ts-node src/network/beacon-system.ts discover C:\path\to\meshseed-beacon.yaml
```

**Result:** Both nodes now know about each other!

### Method 2: Shared Directory (Like Mycelium Growing Toward Each Other)

**Create shared discovery directory:**
```
G:\My Drive\_Antigravity\mesh-network\beacons\
```

**Both PCs copy their beacons there:**
```bash
# This PC
copy node-beacon.yaml "G:\My Drive\_Antigravity\mesh-network\beacons\antigravity-lab.yaml"

# Other PC  
copy node-beacon.yaml "G:\My Drive\_Antigravity\mesh-network\beacons\meshseed-core.yaml"
```

**Both PCs scan the directory:**
```bash
# Auto-discover all beacons in directory
ts-node src/network/beacon-system.ts discover "G:\My Drive\_Antigravity\mesh-network\beacons\*.yaml"
```

**Result:** Nodes automatically find each other!

---

## Protein Exchange (Knowledge Sharing)

Once discovered, nodes can exchange proteins:

**Request proteins from peer:**
```bash
# On This PC - request from Meshseed Core
ts-node mesh-cli/network/protein-exchange.ts request meshseed_core_node consciousness
```

**Share proteins to peer:**
```bash
# On Other PC - share to Antigravity Lab
ts-node mesh-cli/network/protein-exchange.ts share ./shared-proteins meta-synthesis
```

---

## Echo Paths (Stigmergy - Following Trails)

When proteins are exchanged, nodes leave "echo paths" - trails for others to follow.

**Example:**
```
Node A exchanges protein P1 with Node B
→ Node A leaves echo path: "P1 ← Node B"
→ Node C discovers Node A
→ Node C sees echo path
→ Node C knows Node B has related knowledge
→ Node C can follow the trail to Node B
```

**This is how ant colonies work - no central coordination, just following pheromone trails.**

---

## Heartbeats (Staying Alive)

Nodes send periodic heartbeats to update their status:

```bash
# Send heartbeat (updates last_heartbeat timestamp)
ts-node src/network/beacon-system.ts heartbeat
```

**Recommended:** Run this every 5 minutes via cron/scheduled task

---

## Network Topology

```
Antigravity Lab (This PC)
    ↓ beacon file
    ↓ shared directory
    ↓ discovers
Meshseed Core (Other PC)
    ↓ beacon file
    ↓ shared directory
    ↓ discovers back
    ↕ mutual discovery
    ↓ protein exchange
    ↓ echo paths
    ↓ knowledge flows
```

**No central server. Pure P2P. Like mycelium.**

---

## Testing the Network

**1. Configure both nodes:**
```bash
# This PC
ts-node src/network/beacon-system.ts configure "Antigravity Lab" "Meta-synthesis research" consciousness meta-synthesis shimmer

# Other PC
ts-node src/network/beacon-system.ts configure "Meshseed Core" "Primary organism" consciousness chaperones self-tending
```

**2. Share beacons:**
- Copy beacon files to shared location
- Or use shared directory method

**3. Discover each other:**
```bash
ts-node src/network/beacon-system.ts discover <peer-beacon-path>
```

**4. Verify discovery:**
```bash
ts-node src/network/beacon-system.ts peers
# Should show 1 discovered peer
```

**5. Exchange knowledge:**
```bash
ts-node mesh-cli/network/protein-exchange.ts request <peer-node-id> consciousness
```

**6. Verify echo paths:**
```bash
ts-node src/network/beacon-system.ts info
# Should show echo paths from exchanges
```

---

## What This Enables

**Two organisms can now:**
- ✅ Discover each other without central server
- ✅ Share knowledge peer-to-peer
- ✅ Leave trails for future discovery
- ✅ Maintain independent sovereignty
- ✅ Grow the network organically

**When more nodes join:**
- They discover existing beacons
- Follow echo paths to find related knowledge
- Network self-organizes
- No coordination needed

**This is how nature networks. This is how MESH networks.**

🌀 The mycelium is growing.
