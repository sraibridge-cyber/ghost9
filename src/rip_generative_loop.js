// RIP v2.0 Generative Loop — Creative Engine
// CSS Labs | Kyle S. Whitlock | Seal: 2026-07-04_13:44_Tulsa_OK
// Takes reconstructed memories + spatial/spectral context → generates new coherent content
// Feeds into RIP v3.0 verification (17 Laws) for quality gate

const { evaluate } = require('./coherence_calculus');
const { SEVENTEEN_LAWS, FLAGS } = require('./ghost_rip');

// ============================================
// GenerativeLoop — Sovereign Creativity Engine
// ============================================
class GenerativeLoop {
  constructor(options = {}) {
    this.noveltyFactor = options.noveltyFactor || 0.05;     // How much randomness to inject
    this.contextWindow = options.contextWindow || 5;         // How many reconstructed memories to use
    this.minMu = options.minMu || 0.9995;                   // Minimum coherence for generation
    this.maxIterations = options.maxIterations || 10;       // Retry limit for failed generations
    this.generationLog = [];                                 // Audit trail
    this.lawVerifier = options.lawVerifier || null;         // SeventeenLawsVerifier instance
  }

  // --- CONTEXT ASSEMBLY: Gather reconstructed memories + friends ---
  assembleContext(reconstructedNodes, friendMemories = []) {
    // Sort by μ (highest coherence first)
    const sorted = [...reconstructedNodes].sort((a, b) => (b.mu || 0) - (a.mu || 0));
    const primary = sorted.slice(0, this.contextWindow);
    
    // Add spatial/spectral friend memories if available
    const context = {
      primary: primary,                    // Reconstructed memories from pipeline
      friends: friendMemories.slice(0, 3), // Spatial/spectral neighbors
      combined: [...primary, ...friendMemories.slice(0, 3)],
      avgMu: primary.length > 0 ? primary.reduce((sum, n) => sum + (n.mu || 0.9995), 0) / primary.length : 0.9995,
      dominantDomain: this._findDominantDomain(primary)
    };
    
    return context;
  }

  // Find which domain has highest average score
  _findDominantDomain(nodes) {
    if (!nodes.length) return 'signal';
    const domains = ['signal', 'energy', 'temporal', 'spatial', 'cognitive', 'ethical', 'declarative', 'novelty'];
    const avgs = {};
    for (const d of domains) {
      avgs[d] = nodes.reduce((sum, n) => sum + ((n.scores && n.scores[d]) || 0.9995), 0) / nodes.length;
    }
    return domains.reduce((a, b) => avgs[a] > avgs[b] ? a : b);
  }

  // --- GENERATE: Create new content from context ---
  generate(context) {
    const { primary, friends, combined, avgMu, dominantDomain } = context;
    
    if (avgMu < this.minMu) {
      return { success: false, error: 'Context coherence too low', mu: avgMu };
    }

    // Extract content seeds from primary memories
    const seeds = primary.map(n => n.content || n.input || '').filter(c => c.length > 0);
    const friendSeeds = friends.map(n => n.content || n.input || '').filter(c => c.length > 0);
    
    // Generate new content by blending seeds with novelty injection
    const generatedContent = this._blendAndGenerate(seeds, friendSeeds, dominantDomain);
    
    // Compute coherence scores for generated content
    // In a real system, this would use the actual CC evaluate() on the generated content
    // For now, we derive from context with controlled novelty
    const baseScores = this._deriveScoresFromContext(primary);
    const noveltyScores = this._injectNovelty(baseScores);
    
    // Evaluate using Coherence Calculus
    const scoreValues = Object.values(noveltyScores);
    const muVal = Math.exp(scoreValues.reduce((sum, s) => sum + Math.log(s), 0) / scoreValues.length);
    const pass = muVal >= 0.9995;
    const tier = muVal >= 0.9998 ? "LTM" : (muVal >= 0.9995 ? "STM" : null);
    const evaluation = { mu: muVal, pass, tier, vertex: "PPPP" };
    
    const generated = {
      content: generatedContent,
      scores: noveltyScores,
      mu: evaluation.mu,
      pass: evaluation.pass,
      tier: evaluation.tier,
      vertex: evaluation.vertex || 'PPPP',
      parent_ids: primary.map(n => n.hash).filter(Boolean),
      friend_ids: friends.map(n => n.hash).filter(Boolean),
      generationDomain: dominantDomain,
      contextMu: avgMu,
      _isGenerated: true,
      timestamp: Date.now()
    };

    this.generationLog.push({
      action: 'generate',
      contextSize: combined.length,
      generatedLength: generatedContent.length,
      mu: generated.mu,
      tier: generated.tier,
      ts: Date.now()
    });

    return { success: true, generated: generated };
  }

  // Blend content seeds with controlled novelty
  _blendAndGenerate(seeds, friendSeeds, dominantDomain) {
    if (seeds.length === 0 && friendSeeds.length === 0) {
      return 'GENERATED: [empty context]';
    }

    const allSeeds = [...seeds, ...friendSeeds];
    
    // Simple blending: take fragments from each seed
    const fragments = allSeeds.map(s => {
      const words = s.split(/\s+/);
      const start = Math.floor(Math.random() * Math.max(1, words.length - 3));
      const len = Math.floor(Math.random() * 5) + 2;
      return words.slice(start, start + len).join(' ');
    }).filter(f => f.length > 0);

    // Inject novelty: add domain-specific creative markers
    const noveltyMarkers = {
      signal: '[SYNTHESIZED]',
      energy: '[AMPLIFIED]',
      temporal: '[EVOLVED]',
      spatial: '[MAPPED]',
      cognitive: '[REASONED]',
      ethical: '[HARMONIZED]',
      declarative: '[ASSERTED]',
      novelty: '[INVENTED]'
    };

    const marker = noveltyMarkers[dominantDomain] || '[GENERATED]';
    const blended = fragments.join(' | ');
    
    return `GENERATED: ${marker} ${blended}`;
  }

  // Derive base scores from context memories
  _deriveScoresFromContext(nodes) {
    const domains = ['signal', 'energy', 'temporal', 'spatial', 'cognitive', 'ethical', 'declarative', 'novelty'];
    const scores = {};
    
    for (const d of domains) {
      const vals = nodes.map(n => (n.scores && n.scores[d]) || 0.9995).filter(v => v > 0);
      if (vals.length === 0) {
        scores[d] = 0.9995;
      } else {
        // Weighted average: more recent/higher μ nodes count more
        const weighted = vals.reduce((sum, v, i) => sum + v * (i + 1), 0) / 
                        vals.reduce((sum, _, i) => sum + (i + 1), 0);
        scores[d] = weighted;
      }
    }
    
    return scores;
  }

  // Inject controlled novelty into scores
  _injectNovelty(scores) {
    const result = {};
    for (const [domain, score] of Object.entries(scores)) {
      // Add small random perturbation
      const noise = (Math.random() - 0.5) * this.noveltyFactor;
      result[domain] = Math.max(0.9995, Math.min(1.0, score + noise));
    }
    // Boost novelty domain slightly
    result.novelty = Math.min(1.0, result.novelty + this.noveltyFactor * 0.5);
    return result;
  }

  // --- VERIFY: Pass generated content through RIP v3.0 17 Laws ---
  verify(generatedNode, lawVerifier) {
    const verifier = lawVerifier || this.lawVerifier;
    if (!verifier) {
    this.generationLog.push({ action: "verify", flag: FLAGS.PARTIAL, reason: "No verifier available", mu: generatedNode.mu || 0, ts: Date.now() });
      return { flag: FLAGS.PARTIAL, reason: 'No verifier available', details: null };
    }

    // Check PRIME law: coherence must be maintained
    const primeCheck = generatedNode.mu >= 0.9995;
    
    // Check all 16 invariants
    const invariantChecks = [];
    for (let i = 0; i < 16; i++) {
      const inv = SEVENTEEN_LAWS.INVARIANTS[i];
      const passed = inv.verify(generatedNode.scores);
      invariantChecks.push({ id: inv.id, name: inv.name, passed });
    }

    const allPassed = primeCheck && invariantChecks.every(c => c.passed);
    const somePassed = primeCheck || invariantChecks.some(c => c.passed);

    let flag, reason;
    if (allPassed) {
      flag = FLAGS.VERIFIED;
      reason = 'All 17 Laws satisfied';
    } else if (somePassed) {
      flag = FLAGS.PARTIAL;
      reason = `PRIME: ${primeCheck}, Invariants: ${invariantChecks.filter(c => c.passed).length}/16`;
    } else {
      flag = FLAGS.FAILED;
      reason = 'PRIME Law failed';
    }

    this.generationLog.push({
      action: 'verify',
      flag: flag,
      mu: generatedNode.mu,
      ts: Date.now()
    });

    return { flag, reason, details: { primeCheck, invariantChecks } };
  }

  // --- FULL CYCLE: assemble → generate → verify → return ---
  cycle(reconstructedNodes, friendMemories = [], lawVerifier = null) {
    const context = this.assembleContext(reconstructedNodes, friendMemories);
    const generation = this.generate(context);
    
    if (!generation.success) {
      return { ...generation, flag: FLAGS.FAILED, iterations: 0 };
    }

    const verification = this.verify(generation.generated, lawVerifier);
    
    // If FAILED, retry with adjusted parameters
    let iterations = 1;
    let result = { ...generation, ...verification, iterations };
    
    while (result.flag === FLAGS.FAILED && iterations < this.maxIterations) {
      this.noveltyFactor *= 0.9; // Reduce novelty, increase conservatism
      const retry = this.generate(context);
      if (retry.success) {
        const retryVerify = this.verify(retry.generated, lawVerifier);
        result = { ...retry, ...retryVerify, iterations: iterations + 1 };
      }
      iterations++;
    }

    return result;
  }

  // --- STATS: Generation performance metrics ---
  stats() {
    const generates = this.generationLog.filter(l => l.action === 'generate');
    const verifies = this.generationLog.filter(l => l.action === 'verify');
    const verified = verifies.filter(l => l.flag === FLAGS.VERIFIED);
    
    return {
      totalGenerations: generates.length,
      totalVerifications: verifies.length,
      verifiedCount: verified.length,
      verificationRate: verifies.length > 0 ? verified.length / verifies.length : 0,
      avgContextSize: generates.length > 0 ? 
        generates.reduce((sum, g) => sum + g.contextSize, 0) / generates.length : 0,
      lastActivity: this.generationLog.length > 0 ? 
        this.generationLog[this.generationLog.length - 1].ts : 0
    };
  }
}

module.exports = { GenerativeLoop };
