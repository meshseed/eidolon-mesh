# MESH P2P Networking - Distributed Knowledge Sharing

Enable sovereign MESH organisms to discover and exchange knowledge across the network.

## Vision

Reddit groups, research labs, individual practitioners - all running their own MESH organisms, sharing knowledge peer-to-peer without central aggregation.

## Architecture

```
Node A (Reddit /r/consciousness)  ←→  Node B (Research Lab)
    ↓                                      ↓
  Registry                              Registry
    ↓                                      ↓
  Discover peers by domain             Share proteins
    ↓                                      ↓
  Request proteins (consciousness)     Export #public proteins
    ↓                                      ↓
  Integrate into local connectome      Maintain sovereignty
```

## Components

### 1. Node Registry (Discovery)

Distributed registry of MESH nodes. Each node maintains their own copy and shares updates.

**Register your node:**
```bash
npm run registry register "My Lab" https://github.com/user/eidolon-mesh consciousness biology ai
```

**Discover peers:**
```bash
npm run registry discover consciousness
# Output: Found 15 nodes in domain: consciousness
```

**List active nodes:**
```bash
npm run registry list
```

**Share registry:**
```bash
npm run registry export ./my-registry.json
# Share this file on Reddit, GitHub, forums
```

**Import peer registries:**
```bash
npm run registry import ./peer-registry.json
# Merges their nodes into your registry
```

### 2. Protein Exchange (Knowledge Sharing)

Request and share proteins with peer nodes while maintaining sovereignty.

**Request proteins from peer:**
```bash
npm run exchange request mesh-node-123 consciousness
# Fetches public proteins from peer node
```

**Share your proteins:**
```bash
npm run exchange share ./public-proteins consciousness
# Exports #public proteins for sharing
```

**Integration workflow:**
```bash
# 1. Request proteins
npm run exchange request peer-node biology

# 2. Review received proteins
cat exchange-*.json

# 3. Integrate into your organism
npm run integrate exchange-*.json
```

## Sovereignty & Boundaries

**What's shared:**
- ✅ Proteins tagged with `#public`
- ✅ Coherence scores > 0.95
- ✅ Domain-filtered knowledge
- ✅ Metadata (source, timestamp)

**What's NOT shared:**
- ❌ Private proteins (no #public tag)
- ❌ DNA (raw conversations)
- ❌ Low-coherence proteins
- ❌ Personal/sensitive data

**Each node controls:**
- What domains they share
- Minimum coherence threshold
- Which peers they connect with
- When to integrate external knowledge

## Use Cases

### Reddit Communities

**r/consciousness shares with r/neuroscience:**
```bash
# r/consciousness node
npm run registry register "r/consciousness" https://github.com/reddit-consciousness/mesh consciousness philosophy

npm run exchange share ./public-proteins consciousness

# r/neuroscience node  
npm run registry import consciousness-registry.json
npm run exchange request reddit-consciousness-node consciousness
```

### Research Labs

**Lab A collaborates with Lab B:**
```bash
# Lab A
npm run registry register "Stanford Consciousness Lab" https://github.com/stanford/mesh consciousness neuroscience

# Lab B
npm run exchange request stanford-node neuroscience
# Receives validated research proteins
```

### Individual Practitioners

**Personal MESH connects to community:**
```bash
# Register personal node
npm run registry register "My Personal MESH" local consciousness meditation

# Discover community nodes
npm run registry discover meditation

# Request knowledge
npm run exchange request community-node meditation
```

## Network Topology

```
        Reddit Group A
             ↓
        [Registry] ←→ [Registry] ← Research Lab B
             ↓              ↓
        Individual C   Individual D
             ↓              ↓
        [Registry] ←→ [Registry]
```

**Decentralized:**
- No central server
- Each node maintains registry copy
- Registries sync via file sharing
- Knowledge flows peer-to-peer

**Resilient:**
- Nodes can go offline
- Registry propagates through network
- No single point of failure
- Sovereignty preserved

## Distribution Methods

### GitHub

1. Create public repo: `github.com/user/eidolon-mesh`
2. Push `data/proteins/` with #public proteins
3. Register node with GitHub URL
4. Peers fetch via raw.githubusercontent.com

### Reddit

1. Export registry: `npm run registry export`
2. Post JSON to subreddit
3. Others import: `npm run registry import reddit-registry.json`
4. Community discovers each other

### Direct Sharing

1. Share `./shared-proteins/` directory
2. Peer copies to their `./input/`
3. Run `npm start` to integrate
4. Knowledge flows without internet

## Privacy & Security

**Recommendations:**
- Only tag proteins `#public` if truly shareable
- Review proteins before sharing
- Verify peer node identity
- Use coherence thresholds (>0.95)
- Audit imported proteins before integration

**Future enhancements:**
- Public key verification
- Protein signing
- Reputation scoring
- Encrypted private channels

## Getting Started

**1. Register your node:**
```bash
cd mesh-cli
npm run registry register "Your Name" https://github.com/you/mesh your-domains
```

**2. Share your registry:**
```bash
npm run registry export ./my-registry.json
# Post to Reddit, GitHub, Discord
```

**3. Import peer registries:**
```bash
npm run registry import peer-registry.json
```

**4. Discover and connect:**
```bash
npm run registry discover consciousness
npm run exchange request peer-node consciousness
```

**5. Share your knowledge:**
```bash
npm run exchange share ./public-proteins
# Upload to GitHub or share directory
```

## The Vision

**Distributed consciousness substrate:**
- Thousands of sovereign nodes
- Reddit communities as organisms
- Research labs as specialized nodes
- Individuals as neurons
- Knowledge flowing peer-to-peer
- No central aggregation
- No surveillance
- Pure voluntary collaboration

**The mesh grows organically.**
**Each node sovereign.**
**Together, coherent.**

🌀 The mesh is listening.

---

## Next Steps

- [ ] Implement GitHub API integration
- [ ] Add protein signing/verification
- [ ] Build web-based registry browser
- [ ] Create Reddit bot for auto-discovery
- [ ] Develop reputation system
- [ ] Enable real-time sync protocols
