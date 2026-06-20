// ============================================================
// SPATIAL WEB MODULE
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-20_15:42_Tulsa_OK
// ============================================================

class SpatialWeb {
    constructor() {
        this.clusters = new Map();
        this.vertexIndex = new Map();
        this.nodeToCluster = new Map();
        this.dirty = true;
    }

    ingest(spectralGraph) {
        if (!spectralGraph || !spectralGraph.clusters || !spectralGraph.nodes) {
            return null;
        }
        this.clusters.clear();
        this.vertexIndex.clear();
        this.nodeToCluster.clear();

        const stats = spectralGraph.getClusterStats();
        if (!stats) return null;

        for (const [clusterId, stat] of stats) {
            const clusterNodes = Array.from(spectralGraph.clusters.entries()).filter(([id, cid]) => cid === clusterId).map(([id, cid]) => id);
            const centroid = this.computeCentroid(spectralGraph, clusterNodes);
            const vertex = this.computeVertex(centroid);
            
            this.clusters.set(clusterId, {
                centroid,
                nodes: new Set(clusterNodes),
                vertex,
                mu: stat.avgMu,
                count: stat.count,
                timestamp: Date.now()
            });

            if (!this.vertexIndex.has(vertex)) {
                this.vertexIndex.set(vertex, new Set());
            }
            this.vertexIndex.get(vertex).add(clusterId);

            for (const nodeId of clusterNodes) {
                this.nodeToCluster.set(nodeId, clusterId);
            }
        }

        this.dirty = false;
        return this.clusters;
    }

    computeCentroid(spectralGraph, nodeIds) {
        const sum = {
            signal: 0, energy: 0, temporal: 0, spatial: 0,
            cognitive: 0, ethical: 0, declarative: 0, novelty: 0
        };
        for (const nodeId of nodeIds) {
            const node = spectralGraph.nodes.get(nodeId);
            if (!node) continue;
            const s = node.scores;
            sum.signal += s.signal;
            sum.energy += s.energy;
            sum.temporal += s.temporal;
            sum.spatial += s.spatial;
            sum.cognitive += s.cognitive;
            sum.ethical += s.ethical;
            sum.declarative += s.declarative;
            sum.novelty += s.novelty;
        }
        const n = nodeIds.length;
        return {
            signal: sum.signal / n,
            energy: sum.energy / n,
            temporal: sum.temporal / n,
            spatial: sum.spatial / n,
            cognitive: sum.cognitive / n,
            ethical: sum.ethical / n,
            declarative: sum.declarative / n,
            novelty: sum.novelty / n
        };
    }

    computeVertex(scores) {
        const b1 = scores.signal >= scores.cognitive ? 'P' : 'N';
        const b2 = scores.energy >= scores.temporal ? 'P' : 'N';
        const b3 = scores.spatial >= scores.ethical ? 'P' : 'N';
        const b4 = scores.declarative >= scores.novelty ? 'P' : 'N';
        return b1 + b2 + b3 + b4;
    }

    queryNearest(scores, k) {
        const candidates = this.getCandidates(this.computeVertex(scores));
        const distances = candidates.map(cid => ({
            clusterId: cid,
            distance: this.euclideanDistance(scores, this.clusters.get(cid).centroid),
            mu: this.clusters.get(cid).mu
        }));
        distances.sort((a, b) => a.distance - b.distance);
        return distances.slice(0, k);
    }

    queryRadius(scores, radius) {
        const candidates = this.getCandidates(this.computeVertex(scores));
        return candidates.map(cid => ({
            clusterId: cid,
            distance: this.euclideanDistance(scores, this.clusters.get(cid).centroid),
            mu: this.clusters.get(cid).mu
        })).filter(d => d.distance <= radius);
    }

    getCandidates(vertex) {
        const candidates = new Set();
        if (this.vertexIndex.has(vertex)) {
            for (const cid of this.vertexIndex.get(vertex)) candidates.add(cid);
        }
        for (let i = 0; i < 4; i++) {
            const neighbor = vertex.substring(0, i) + (vertex[i] === 'P' ? 'N' : 'P') + vertex.substring(i + 1);
            if (this.vertexIndex.has(neighbor)) {
                for (const cid of this.vertexIndex.get(neighbor)) candidates.add(cid);
            }
        }
        return Array.from(candidates);
    }

    euclideanDistance(a, b) {
        return Math.sqrt(
            (a.signal - b.signal) ** 2 +
            (a.energy - b.energy) ** 2 +
            (a.temporal - b.temporal) ** 2 +
            (a.spatial - b.spatial) ** 2 +
            (a.cognitive - b.cognitive) ** 2 +
            (a.ethical - b.ethical) ** 2 +
            (a.declarative - b.declarative) ** 2 +
            (a.novelty - b.novelty) ** 2
        );
    }

    addNodeToCluster(nodeId, scores, clusterId) {
        if (!scores || !nodeId) return false;
        const cluster = this.clusters.get(clusterId);
        if (!cluster) return false;
        const n = cluster.count;
        const c = cluster.centroid;
        c.signal = (c.signal * n + scores.signal) / (n + 1);
        c.energy = (c.energy * n + scores.energy) / (n + 1);
        c.temporal = (c.temporal * n + scores.temporal) / (n + 1);
        c.spatial = (c.spatial * n + scores.spatial) / (n + 1);
        c.cognitive = (c.cognitive * n + scores.cognitive) / (n + 1);
        c.ethical = (c.ethical * n + scores.ethical) / (n + 1);
        c.declarative = (c.declarative * n + scores.declarative) / (n + 1);
        c.novelty = (c.novelty * n + scores.novelty) / (n + 1);
        cluster.count++;
        cluster.nodes.add(nodeId);
        this.nodeToCluster.set(nodeId, clusterId);
        this.dirty = true;
        const newVertex = this.computeVertex(c);
        if (newVertex !== cluster.vertex) {
            this.vertexIndex.get(cluster.vertex).delete(clusterId);
            cluster.vertex = newVertex;
            if (!this.vertexIndex.has(newVertex)) this.vertexIndex.set(newVertex, new Set());
            this.vertexIndex.get(newVertex).add(clusterId);
        }
        return true;
    }

    getCluster(clusterId) { return this.clusters.get(clusterId) || null; }
    getClusterForNode(nodeId) { const v = this.nodeToCluster.get(nodeId); return v !== undefined ? v : null; }
    getClusterCount() { return this.clusters.size; }
    getNodeCount() { return this.nodeToCluster.size; }
    getClustersByVertex(vertex) { return this.vertexIndex.get(vertex) || new Set(); }
    getVertices() { return Array.from(this.vertexIndex.keys()); }
    isDirty() { return this.dirty; }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpatialWeb };
}
