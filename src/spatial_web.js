// ============================================================
// SPATIAL WEB MODULE
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-20_15:42_Tulsa_OK
// ============================================================

const D_TO_NAMED = {
    D1: 'signal', D2: 'energy', D3: 'temporal', D4: 'spatial',
    D5: 'cognitive', D6: 'ethical', D7: 'declarative', D8: 'novelty'
};
const UPSERT_RADIUS = 0.05;
const DEFAULT_SCORE = require('./thresholds').STM_MIN;

// Accepts CC scores keyed D1..D8 or named keys; returns named keys.
function namedScores(scores) {
    const out = {};
    for (const [d, name] of Object.entries(D_TO_NAMED)) {
        const v = scores && (typeof scores[d] === 'number' ? scores[d] : scores[name]);
        out[name] = typeof v === 'number' ? v : DEFAULT_SCORE;
    }
    return out;
}

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

    // ---- Compatibility API used by ghost_face.js (review fix) ----
    _nextId() {
        if (this._nextClusterId === undefined) this._nextClusterId = 1;
        return this._nextClusterId++;
    }

    _createCluster(clusterId, nodeId, scores, mu) {
        const centroid = { ...scores };
        const vertex = this.computeVertex(centroid);
        this.clusters.set(clusterId, {
            centroid,
            nodes: new Set([nodeId]),
            memberScores: new Map([[nodeId, { ...scores }]]),
            vertex,
            mu: typeof mu === 'number' ? mu : DEFAULT_SCORE,
            count: 1,
            timestamp: Date.now()
        });
        if (!this.vertexIndex.has(vertex)) this.vertexIndex.set(vertex, new Set());
        this.vertexIndex.get(vertex).add(clusterId);
        this.nodeToCluster.set(nodeId, clusterId);
        return clusterId;
    }

    _nearestCluster(scores, radius) {
        let best = null;
        for (const [cid, cluster] of this.clusters) {
            const d = this.euclideanDistance(scores, cluster.centroid);
            if (d <= radius && (!best || d < best.distance)) best = { clusterId: cid, distance: d };
        }
        return best;
    }

    _neighborClusterCount(vertex) {
        let total = 0;
        for (let i = 0; i < 4; i++) {
            const neighbor = vertex.substring(0, i) + (vertex[i] === 'P' ? 'N' : 'P') + vertex.substring(i + 1);
            if (this.vertexIndex.has(neighbor)) total += this.vertexIndex.get(neighbor).size;
        }
        return total;
    }

    upsert(node) {
        const id = node && (node.id || node.hash);
        if (!id) return { ok: false, reason: 'no_id' };
        if (this.nodeToCluster.has(id)) this.remove(id);

        const scores = namedScores(node.scores);
        const nearest = this._nearestCluster(scores, UPSERT_RADIUS);
        let clusterId;
        let created = false;
        let edgesAdded = 0;

        if (nearest) {
            clusterId = nearest.clusterId;
            const cluster = this.clusters.get(clusterId);
            this.addNodeToCluster(id, scores, clusterId);
            cluster.memberScores = cluster.memberScores || new Map();
            cluster.memberScores.set(id, { ...scores });
        } else {
            clusterId = this._createCluster(this._nextId(), id, scores, node.mu);
            created = true;
            edgesAdded = this._neighborClusterCount(this.clusters.get(clusterId).vertex);
        }
        this.dirty = true;
        return { ok: true, clusterId, created, edgesAdded };
    }

    remove(id) {
        const cid = this.nodeToCluster.get(id);
        if (cid === undefined) return false;
        const cluster = this.clusters.get(cid);
        this.nodeToCluster.delete(id);
        if (cluster) {
            cluster.nodes.delete(id);
            if (cluster.memberScores) cluster.memberScores.delete(id);
            cluster.count = cluster.nodes.size;
            if (cluster.count === 0) {
                const bucket = this.vertexIndex.get(cluster.vertex);
                if (bucket) bucket.delete(cid);
                this.clusters.delete(cid);
            } else if (cluster.memberScores && cluster.memberScores.size > 0) {
                const c = { signal: 0, energy: 0, temporal: 0, spatial: 0, cognitive: 0, ethical: 0, declarative: 0, novelty: 0 };
                for (const s of cluster.memberScores.values()) for (const k of Object.keys(c)) c[k] += s[k];
                const n = cluster.memberScores.size;
                for (const k of Object.keys(c)) cluster.centroid[k] = c[k] / n;
                const newVertex = this.computeVertex(cluster.centroid);
                if (newVertex !== cluster.vertex) {
                    this.vertexIndex.get(cluster.vertex).delete(cid);
                    cluster.vertex = newVertex;
                    if (!this.vertexIndex.has(newVertex)) this.vertexIndex.set(newVertex, new Set());
                    this.vertexIndex.get(newVertex).add(cid);
                }
            }
        }
        this.dirty = true;
        return true;
    }

    _edgeCount() {
        const vertices = Array.from(this.vertexIndex.keys());
        let edges = 0;
        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 1; j < vertices.length; j++) {
                const a = vertices[i];
                const b = vertices[j];
                let diff = 0;
                for (let k = 0; k < 4; k++) if (a[k] !== b[k]) diff++;
                if (diff === 1) edges += this.vertexIndex.get(a).size * this.vertexIndex.get(b).size;
            }
        }
        return edges;
    }

    stats() {
        return {
            nodes: this.getNodeCount(),
            clusters: this.getClusterCount(),
            edges: this._edgeCount(),
            learningCycles: this._learningCycles || 0
        };
    }

    computeVoid(ltmIds) {
        const ltm = ltmIds || new Set();
        const voidIds = new Set();
        for (const id of this.nodeToCluster.keys()) {
            if (!ltm.has(id)) voidIds.add(id);
        }
        return voidIds;
    }

    spatialClusters(voidIds) {
        const groups = [];
        for (const cluster of this.clusters.values()) {
            const members = Array.from(cluster.nodes).filter(id => voidIds && voidIds.has(id));
            if (members.length > 0) groups.push(members);
        }
        return groups;
    }

    voidProximityMap(k) {
        const map = {};
        const limit = k || 5;
        for (const [cid, cluster] of this.clusters) {
            const hasVoid = Array.from(cluster.nodes).some(id => this.nodeToCluster.has(id));
            if (!hasVoid) continue;
            map[cid] = this.queryNearest(cluster.centroid, limit + 1)
                .filter(r => r.clusterId !== cid)
                .slice(0, limit)
                .map(r => r.clusterId);
        }
        return map;
    }

    serialize() {
        return {
            version: 1,
            nextClusterId: this._nextClusterId || 1,
            clusters: Array.from(this.clusters.entries()).map(([cid, c]) => ({
                cid,
                centroid: c.centroid,
                nodes: Array.from(c.nodes),
                vertex: c.vertex,
                mu: c.mu,
                count: c.count,
                timestamp: c.timestamp,
                memberScores: c.memberScores ? Array.from(c.memberScores.entries()) : null
            }))
        };
    }

    static deserialize(snap) {
        const w = new SpatialWeb();
        w._nextClusterId = (snap && snap.nextClusterId) || 1;
        for (const c of (snap && snap.clusters) || []) {
            w.clusters.set(c.cid, {
                centroid: c.centroid,
                nodes: new Set(c.nodes),
                memberScores: c.memberScores ? new Map(c.memberScores) : null,
                vertex: c.vertex,
                mu: c.mu,
                count: c.count,
                timestamp: c.timestamp
            });
            if (!w.vertexIndex.has(c.vertex)) w.vertexIndex.set(c.vertex, new Set());
            w.vertexIndex.get(c.vertex).add(c.cid);
            for (const id of c.nodes) w.nodeToCluster.set(id, c.cid);
        }
        w.dirty = false;
        return w;
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
