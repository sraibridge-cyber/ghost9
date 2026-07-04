// ============================================================
// SPECTRAL GRAPH MODULE — Ghost9 Ingestion Layer
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-19_23:05_Tulsa_OK
// Spectral clustering for CC v3.0 scored memories
// Weighted graph G = (V, E, w), Laplacian L = D - A
// ============================================================

class SpectralGraph {
    constructor() {
        this.nodes = new Map();      // id -> {scores, vertex, mu, timestamp}
        this.edges = new Map();      // id -> Set of neighbor ids
        this.weights = new Map();    // "id1|id2" -> weight
        this.adjacency = null;       // cached adjacency matrix
        this.laplacian = null;       // cached Laplacian matrix
        this.eigenvalues = null;     // cached eigenvalues
        this.eigenvectors = null;    // cached eigenvectors
        this.clusters = null;        // cached cluster assignments
        this.dirty = true;           // cache invalidation flag
    }

    // Add a memory node with CC v3.0 scores
    addNode(id, scores, mu, timestamp = Date.now()) {
        const vertex = this.assignVertex(scores);
        this.nodes.set(id, { scores, vertex, mu, timestamp });
        this.edges.set(id, new Set());
        this.dirty = true;
        return vertex;
    }

    // B⁴ Tesseract vertex assignment
    assignVertex(scores) {
        const b1 = scores.signal >= scores.cognitive ? 'P' : 'N';
        const b2 = scores.energy >= scores.temporal ? 'P' : 'N';
        const b3 = scores.spatial >= scores.ethical ? 'P' : 'N';
        const b4 = scores.declarative >= scores.novelty ? 'P' : 'N';
        return b1 + b2 + b3 + b4;
    }

    // Compute resonance weight between two nodes
    // w(i,j) = exp(-||scores_i - scores_j||² / 2σ²)
    computeWeight(id1, id2, sigma = 0.5) {
        const n1 = this.nodes.get(id1);
        const n2 = this.nodes.get(id2);
        if (!n1 || !n2) return 0;

        const diff = [
            n1.scores.signal - n2.scores.signal,
            n1.scores.energy - n2.scores.energy,
            n1.scores.temporal - n2.scores.temporal,
            n1.scores.spatial - n2.scores.spatial,
            n1.scores.cognitive - n2.scores.cognitive,
            n1.scores.ethical - n2.scores.ethical,
            n1.scores.declarative - n2.scores.declarative,
            n1.scores.novelty - n2.scores.novelty
        ];
        const distSq = diff.reduce((a, b) => a + b * b, 0);
        return Math.exp(-distSq / (2 * sigma * sigma));
    }

    // Add edge with computed weight
    addEdge(id1, id2, sigma = 0.5) {
        const w = this.computeWeight(id1, id2, sigma);
        if (w > 0.001) {  // threshold to avoid near-zero edges
            this.edges.get(id1).add(id2);
            this.edges.get(id2).add(id1);
            const key = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
            this.weights.set(key, w);
        }
        this.dirty = true;
        return w;
    }

    // Build k-NN graph (connect each node to k nearest neighbors)
    buildKNN(k = 3) {
        const ids = Array.from(this.nodes.keys());
        for (const id of ids) {
            const neighbors = [];
            for (const other of ids) {
                if (id === other) continue;
                const w = this.computeWeight(id, other);
                neighbors.push({ id: other, weight: w });
            }
            neighbors.sort((a, b) => b.weight - a.weight);
            for (let i = 0; i < Math.min(k, neighbors.length); i++) {
                this.addEdge(id, neighbors[i].id);
            }
        }
        this.dirty = true;
    }

    // Build fully-connected graph (all pairs)
    buildFullyConnected() {
        const ids = Array.from(this.nodes.keys());
        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                this.addEdge(ids[i], ids[j]);
            }
        }
        this.dirty = true;
    }

    // === MATRIX OPERATIONS ===

    // Build adjacency matrix A
    buildAdjacency() {
        const ids = Array.from(this.nodes.keys());
        const n = ids.length;
        const A = Array(n).fill(0).map(() => Array(n).fill(0));
        const idToIdx = new Map(ids.map((id, i) => [id, i]));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    A[i][j] = 0;
                } else {
                    const key = ids[i] < ids[j] ? `${ids[i]}|${ids[j]}` : `${ids[j]}|${ids[i]}`;
                    A[i][j] = this.weights.get(key) || 0;
                }
            }
        }
        this.adjacency = A;
        this.idToIdx = idToIdx;
        this.idxToId = ids;
        return A;
    }

    // Build degree matrix D and Laplacian L = D - A
    buildLaplacian() {
        if (this.nodes.size === 0) {
            this.laplacian = null;
            this.dirty = false;
            return null;
        }
        if (!this.adjacency) this.buildAdjacency();
        const A = this.adjacency;
        const n = A.length;
        const D = Array(n).fill(0).map(() => Array(n).fill(0));
        const L = Array(n).fill(0).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            let degree = 0;
            for (let j = 0; j < n; j++) {
                degree += A[i][j];
            }
            D[i][i] = degree;
            for (let j = 0; j < n; j++) {
                L[i][j] = D[i][j] - A[i][j];
            }
        }
        this.degree = D;
        this.laplacian = L;
        this.dirty = false;
        return L;
    }

    // === SPECTRAL DECOMPOSITION ===

    // Power iteration for dominant eigenvector
    powerIteration(matrix, maxIter = 100, tol = 1e-10) {
        const n = matrix.length;
        let v = Array(n).fill(0).map(() => Math.random());
        // Normalize
        let norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
        v = v.map(x => x / norm);

        for (let iter = 0; iter < maxIter; iter++) {
            // Matrix-vector multiply: Av
            const Av = Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    Av[i] += matrix[i][j] * v[j];
                }
            }
            // Normalize
            const newNorm = Math.sqrt(Av.reduce((a, b) => a + b * b, 0));
            const newV = Av.map(x => x / newNorm);
            // Check convergence
            const diff = Math.sqrt(v.reduce((a, b, i) => a + (b - newV[i]) ** 2, 0));
            v = newV;
            if (diff < tol) break;
        }
        return v;
    }

    // Compute smallest k eigenvectors of Laplacian
    // Using inverse power iteration (shift-and-invert for smallest eigenvalues)
    spectralDecompose(k = 2) {
        if (!this.laplacian) this.buildLaplacian();
        const L = this.laplacian;
        const n = L.length;

        // For small matrices, use direct method
        if (n <= 10) {
            return this.eigendecomposeDirect(L, k);
        }

        // For larger matrices, use power iteration on shifted matrix
        // (L + sigma*I)^-1 has dominant eigenvector = smallest eigenvector of L
        const eigenvalues = [];
        const eigenvectors = [];
        const shift = 0.1;  // small shift to avoid singularity

        for (let eig = 0; eig < k; eig++) {
            let v = Array(n).fill(0).map(() => Math.random());
            let norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
            v = v.map(x => x / norm);

            for (let iter = 0; iter < 200; iter++) {
                // Solve (L + shift*I) * v_new = v_old using Jacobi iteration
                const vNew = this.jacobiSolve(L, v, shift, 50);
                const newNorm = Math.sqrt(vNew.reduce((a, b) => a + b * b, 0));
                const normalized = vNew.map(x => x / newNorm);

                // Gram-Schmidt orthogonalize against previous eigenvectors
                let ortho = normalized;
                for (let prev = 0; prev < eig; prev++) {
                    const proj = ortho.reduce((a, b, i) => a + b * eigenvectors[prev][i], 0);
                    ortho = ortho.map((b, i) => b - proj * eigenvectors[prev][i]);
                }
                const orthoNorm = Math.sqrt(ortho.reduce((a, b) => a + b * b, 0));
                const finalV = ortho.map(x => x / orthoNorm);

                const diff = Math.sqrt(v.reduce((a, b, i) => a + (b - finalV[i]) ** 2, 0));
                v = finalV;
                if (diff < 1e-10) break;
            }

            // Rayleigh quotient for eigenvalue
            const Lv = Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    Lv[i] += L[i][j] * v[j];
                }
            }
            const lambda = v.reduce((a, b, i) => a + b * Lv[i], 0);
            eigenvalues.push(lambda);
            eigenvectors.push(v);
        }

        this.eigenvalues = eigenvalues;
        this.eigenvectors = eigenvectors;
        this.dirty = false;
        return { eigenvalues, eigenvectors };
    }

    // Jacobi iteration for (L + shift*I) * x = b
    jacobiSolve(L, b, shift, maxIter) {
        const n = L.length;
        let x = Array(n).fill(0).map(() => Math.random());
        for (let iter = 0; iter < maxIter; iter++) {
            const xNew = Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                let sum = b[i];
                for (let j = 0; j < n; j++) {
                    if (i !== j) {
                        sum -= (L[i][j] + (i === j ? shift : 0)) * x[j];
                    }
                }
                xNew[i] = sum / (L[i][i] + shift);
            }
            x = xNew;
        }
        return x;
    }

    // Direct eigendecomposition for small matrices (n <= 10)
    // Using QR algorithm for n > 2, analytical for n = 2
    eigendecomposeDirect(matrix, k) {
        const n = matrix.length;
        
        // For 2x2, use direct analytical solution
        if (n === 2) {
            const a = matrix[0][0], b = matrix[0][1], d = matrix[1][1];
            const trace = a + d;
            const det = a * d - b * b;
            const discriminant = trace * trace - 4 * det;
            const sqrtDisc = Math.sqrt(Math.max(0, discriminant));
            const lambda1 = (trace - sqrtDisc) / 2;
            const lambda2 = (trace + sqrtDisc) / 2;
            const eigenvalues = [lambda1, lambda2].sort((a, b) => a - b);
            
            // Eigenvectors
            const eigenvectors = [];
            for (let eig = 0; eig < k; eig++) {
                const lambda = eigenvalues[eig];
                let v;
                if (Math.abs(b) > 1e-10) {
                    v = [1, -(a - lambda) / b];
                } else {
                    v = [eig === 0 ? 1 : 0, eig === 0 ? 0 : 1];
                }
                const norm = Math.sqrt(v[0]*v[0] + v[1]*v[1]);
                v = [v[0]/norm, v[1]/norm];
                eigenvectors.push(v);
            }
            
            this.eigenvalues = eigenvalues.slice(0, k);
            this.eigenvectors = eigenvectors;
            this.dirty = false;
            return { eigenvalues: this.eigenvalues, eigenvectors };
        }
        
        // For larger matrices (3x3 to 10x10), use QR algorithm
        let A = matrix.map(row => [...row]);  // copy

        // QR iteration
        for (let iter = 0; iter < 100; iter++) {
            const { Q, R } = this.qrDecompose(A);
            const newA = this.matrixMultiply(R, Q);
            // Check convergence (off-diagonal elements)
            let offDiag = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i !== j) offDiag += Math.abs(newA[i][j]);
                }
            }
            A = newA;
            if (offDiag < 1e-10) break;
        }

        // Extract eigenvalues (diagonal of A)
        const eigenvalues = [];
        for (let i = 0; i < n; i++) eigenvalues.push(A[i][i]);
        eigenvalues.sort((a, b) => a - b);

        // For eigenvectors, use power iteration on (A - lambda*I)
        const eigenvectors = [];
        for (let eig = 0; eig < k; eig++) {
            const lambda = eigenvalues[eig];
            const shifted = A.map((row, i) => row.map((a, j) => a - (i === j ? lambda : 0)));
            const v = this.powerIteration(shifted);
            eigenvectors.push(v);
        }

        this.eigenvalues = eigenvalues.slice(0, k);
        this.eigenvectors = eigenvectors;
        this.dirty = false;
        return { eigenvalues: this.eigenvalues, eigenvectors };
    }

    // QR decomposition using Gram-Schmidt
    qrDecompose(A) {
        const n = A.length;
        const Q = Array(n).fill(0).map(() => Array(n).fill(0));
        const R = Array(n).fill(0).map(() => Array(n).fill(0));

        for (let j = 0; j < n; j++) {
            let v = A.map(row => row[j]);
            for (let i = 0; i < j; i++) {
                R[i][j] = v.reduce((a, b, k) => a + b * Q[k][i], 0);
                v = v.map((b, k) => b - R[i][j] * Q[k][i]);
            }
            const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
            R[j][j] = norm < 1e-15 ? 1e-15 : norm;
            for (let i = 0; i < n; i++) {
                Q[i][j] = v[i] / R[j][j];
            }
        }
        return { Q, R };
    }

    matrixMultiply(A, B) {
        const n = A.length;
        const C = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                for (let k = 0; k < n; k++) {
                    C[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        return C;
    }

    // === CLUSTERING ===

    // k-means on spectral embeddings
    spectralCluster(k = 2) {
        if (this.dirty || !this.eigenvectors) {
            this.spectralDecompose(k);
        }

        const n = this.eigenvectors[0].length;
        const embeddings = [];
        for (let i = 0; i < n; i++) {
            const point = [];
            for (let j = 0; j < k; j++) {
                point.push(this.eigenvectors[j][i]);
            }
            embeddings.push(point);
        }

        // k-means++ initialization
        const centroids = this.kmeansPlusPlus(embeddings, k);
        let assignments = Array(n).fill(0);
        let changed = true;
        let iter = 0;

        while (changed && iter < 100) {
            changed = false;
            // Assign each point to nearest centroid
            for (let i = 0; i < n; i++) {
                let bestDist = Infinity;
                let bestCluster = 0;
                for (let c = 0; c < k; c++) {
                    const dist = embeddings[i].reduce((a, b, j) => a + (b - centroids[c][j]) ** 2, 0);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestCluster = c;
                    }
                }
                if (assignments[i] !== bestCluster) {
                    assignments[i] = bestCluster;
                    changed = true;
                }
            }

            // Update centroids
            for (let c = 0; c < k; c++) {
                const clusterPoints = embeddings.filter((_, i) => assignments[i] === c);
                if (clusterPoints.length > 0) {
                    for (let j = 0; j < k; j++) {
                        centroids[c][j] = clusterPoints.reduce((a, p) => a + p[j], 0) / clusterPoints.length;
                    }
                }
            }
            iter++;
        }

        // Map back to node IDs
        this.clusters = new Map();
        for (let i = 0; i < n; i++) {
            this.clusters.set(this.idxToId[i], assignments[i]);
        }
        return this.clusters;
    }

    kmeansPlusPlus(points, k) {
        const n = points.length;
        const centroids = [points[Math.floor(Math.random() * n)]];
        for (let c = 1; c < k; c++) {
            const distances = points.map(p => {
                let minDist = Infinity;
                for (const cent of centroids) {
                    const dist = p.reduce((a, b, i) => a + (b - cent[i]) ** 2, 0);
                    if (dist < minDist) minDist = dist;
                }
                return minDist;
            });
            const totalDist = distances.reduce((a, b) => a + b, 0);
            let r = Math.random() * totalDist;
            let idx = 0;
            while (r > distances[idx] && idx < n) {
                r -= distances[idx];
                idx++;
            }
            centroids.push(points[idx]);
        }
        return centroids;
    }

    // === UTILITY ===

    getCluster(id) {
        return this.clusters ? this.clusters.get(id) : null;
    }

    getNeighbors(id) {
        return this.edges.get(id) || new Set();
    }

    getNodeCount() {
        return this.nodes.size;
    }

    getEdgeCount() {
        let count = 0;
        for (const neighbors of this.edges.values()) {
            count += neighbors.size;
        }
        return count / 2;  // undirected
    }

    // Get nodes in a cluster
    getClusterNodes(clusterId) {
        if (!this.clusters) return [];
        return Array.from(this.clusters.entries())
            .filter(([, c]) => c === clusterId)
            .map(([id, _]) => id);
    }

    // Get cluster statistics
    getClusterStats() {
        if (!this.clusters) return null;
        const stats = new Map();
        for (const [id, cluster] of this.clusters) {
            if (!stats.has(cluster)) stats.set(cluster, { count: 0, avgMu: 0 });
            const s = stats.get(cluster);
            s.count++;
            s.avgMu += this.nodes.get(id).mu;
        }
        for (const s of stats.values()) {
            s.avgMu /= s.count;
        }
        return stats;
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpectralGraph };
}
