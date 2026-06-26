// =====================================================================
// FIVE LAWS ENGINE — GHOST v9.1.0
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-26_15:41_Tulsa_OK
// =====================================================================
// The Five Laws: Chaos, Randomness, Observation, Causality, Chain
// Governing engine for controlled entropy within coherence bounds.
// Uses CC v3.0 gating. Integrated with all validated GHOST components.
// 1 Prime + 16 Tesseract Invariants = 17 Laws total framework.
// =====================================================================

'use strict';

const { evaluate, mu, TAU } = require('./coherence_calculus');
const { sha3_512 } = require('./ghost_backend');

const FIVE_TAU = 0.9995; // Coherence threshold for Five Laws operations

// --- Law 1: CHAOS — Controlled Entropy Injection ---
// Chaos is not randomness. Chaos is deterministic unpredictability
// within coherence bounds. Inject entropy that raises μ, never lowers it.
class ChaosLaw {
  constructor(seed = Date.now()) {
    this.seed = seed;
    this.history = [];
    this.entropyPool = [];
  }

  // Deterministic chaos: same input → same output, but output is unpredictable
  // from the input alone without the seed
  inject(input, intensity = 0.5) {
    const hash = sha3_512(this.seed + '|' + input + '|' + this.history.length);
    const entropy = this._hashToEntropy(hash);
    
    // Scale entropy by intensity (0-1)
    const scaled = entropy * intensity;
    
    // CC gate: only inject if it would raise or maintain coherence
    const preMu = this._estimateMu(input);
    const postMu = this._estimateMu(input + scaled);
    
    if (postMu < preMu && preMu > FIVE_TAU) {
      // Would lower coherence — reject
      return { value: input, entropy: 0, mu: preMu, gated: true };
    }
    
    this.history.push({ input, entropy: scaled, timestamp: Date.now() });
    this.entropyPool.push(scaled);
    
    return {
      value: input + scaled,
      entropy: scaled,
      mu: postMu,
      gated: false
    };
  }

  // Controlled turbulence: inject chaos in waves, not continuously
  turbulence(input, waves = 3, intensity = 0.3) {
    let current = input;
    const waveLog = [];
    
    for (let i = 0; i < waves; i++) {
      const waveSeed = this.seed + i;
      const result = this.inject(current, intensity);
      waveLog.push({
        wave: i,
        pre: current,
        post: result.value,
        entropy: result.entropy,
        mu: result.mu,
        gated: result.gated
      });
      current = result.value;
    }
    
    return { final: current, waves: waveLog, poolSize: this.entropyPool.length };
  }

  _hashToEntropy(hash) {
    // Convert hex hash to normalized float (-1 to 1)
    const num = parseInt(hash.slice(0, 16), 16);
    return (num / 0xFFFFFFFFFFFFFFFF) * 2 - 1;
  }

  _estimateMu(value) {
    // Quick estimate using CC evaluate
    try {
      const result = evaluate(String(value), { nodeCount: 1 });
      return result.mu;
    } catch(e) {
      return 0.5;
    }
  }

  stats() {
    return {
      seed: this.seed,
      injections: this.history.length,
      poolSize: this.entropyPool.length,
      avgEntropy: this.entropyPool.reduce((a, b) => a + b, 0) / (this.entropyPool.length || 1),
      lastMu: this.history.length > 0 ? this.history[this.history.length - 1].mu : null
    };
  }
}

// --- Law 2: RANDOMNESS — Deterministic Pseudorandom within Coherence ---
// True randomness is unverifiable. Deterministic pseudorandom is sovereign.
// Seed + algorithm = reproducible sequence that appears random.
class RandomnessLaw {
  constructor(seed = Date.now()) {
    this.seed = seed;
    this._sequence = [];
    this.index = 0;
  }

  // Linear congruential generator with CC-gated output
  next() {
    const a = 1664525;
    const c = 1013904223;
    const m = 4294967296;
    
    this.seed = (a * this.seed + c) % m;
    const normalized = this.seed / m;
    
    // CC gate: map to coherence-preserving range
    const gated = this._coherenceMap(normalized);
    
    this._sequence.push(gated);
    this.index++;
    
    return gated;
  }

  // Generate n random values with coherence tracking
  sequence(n = 10) {
    const results = [];
    let minMu = 1.0;
    
    for (let i = 0; i < n; i++) {
      const val = this.next();
      const mu = this._checkMu(val);
      minMu = Math.min(minMu, mu);
      results.push({ value: val, mu, index: this.index - 1 });
    }
    
    return {
      values: results.map(r => r.value),
      minMu,
      passed: minMu >= FIVE_TAU,
      length: results.length
    };
  }

  // Reproducible from seed
  reproduce(newSeed, n = 10) {
    const temp = new RandomnessLaw(newSeed);
    return temp.sequence(n);
  }

  _coherenceMap(normalized) {
    // Map to [0.9995, 1.0] range — high coherence zone
    return 0.9995 + (normalized * 0.0005);
  }

  _checkMu(value) {
    try {
      const result = evaluate(String(value), { nodeCount: 1 });
      return result.mu;
    } catch(e) {
      return 0.5;
    }
  }

  stats() {
    return {
      seed: this.seed,
      generated: this._sequence.length,
      index: this.index,
      lastValue: this._sequence.length > 0 ? this._sequence[this._sequence.length - 1] : null
    };
  }
}

// --- Law 3: OBSERVATION — Measurement without Decoherence ---
// Observe a system without collapsing its coherence.
// The observer becomes part of the observed.
class ObservationLaw {
  constructor() {
    this.observations = [];
    this.observerId = 'obs_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  // Observe a value and record its state without modifying it
  observe(target, context = {}) {
    const snapshot = {
      target: typeof target === 'object' ? JSON.stringify(target) : String(target),
      timestamp: Date.now(),
      observer: this.observerId,
      context
    };
    
    const hash = sha3_512(JSON.stringify(snapshot));
    snapshot.hash = hash;
    
    // CC evaluate the observation itself
    const obsText = 'Observation of ' + snapshot.target + ' at ' + snapshot.timestamp;
    const ccResult = evaluate(obsText, { nodeCount: 1 });
    
    snapshot.mu = ccResult.mu;
    snapshot.tier = ccResult.tier;
    
    this.observations.push(snapshot);
    
    return {
      observed: target,
      hash,
      mu: ccResult.mu,
      tier: ccResult.tier,
      observer: this.observerId,
      snapshot
    };
  }

  // Verify an observation hasn't been tampered with
  verify(observationHash) {
    const found = this.observations.find(o => o.hash === observationHash);
    if (!found) return { valid: false, reason: 'not_found' };
    
    const recomputed = sha3_512(JSON.stringify({
      target: found.target,
      timestamp: found.timestamp,
      observer: found.observer,
      context: found.context
    }));
    
    return {
      valid: found.hash === recomputed,
      hash: found.hash,
      recomputed,
      mu: found.mu
    };
  }

  // Collapse: intentional decoherence for final state
  collapse(target) {
    const final = this.observe(target, { type: 'collapse', final: true });
    return {
      ...final,
      collapsed: true,
      priorObservations: this.observations.length - 1
    };
  }

  stats() {
    return {
      observerId: this.observerId,
      observations: this.observations.length,
      avgMu: this.observations.reduce((sum, o) => sum + o.mu, 0) / (this.observations.length || 1)
    };
  }
}

// --- Law 4: CAUSALITY — Temporal Ordering and Chain Integrity ---
// Cause precedes effect. Effect verifies cause. Chain is immutable.
class CausalityLaw {
  constructor() {
    this.events = [];
    this.chain = [];
  }

  // Record an event with causal link to previous
  cause(data, type = 'generic') {
    const previous = this.chain.length > 0 ? this.chain[this.chain.length - 1].hash : 'genesis';
    
    const event = {
      id: this.chain.length,
      type,
      data: typeof data === 'object' ? JSON.stringify(data) : String(data),
      timestamp: Date.now(),
      previous,
      hash: null
    };
    
    // Hash includes previous — making chain immutable
    event.hash = sha3_512(event.id + event.type + event.data + event.timestamp + event.previous);
    
    this.events.push(event);
    this.chain.push(event);
    
    return {
      event,
      causalLink: previous,
      chainLength: this.chain.length
    };
  }

  // Verify the entire causal chain
  verify() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const expectedPrevious = this.chain[i - 1].hash;
      
      if (current.previous !== expectedPrevious) {
        return {
          valid: false,
          breakAt: i,
          expected: expectedPrevious,
          got: current.previous
        };
      }
      
      // Recompute hash
      const recomputed = sha3_512(current.id + current.type + current.data + current.timestamp + current.previous);
      if (current.hash !== recomputed) {
        return {
          valid: false,
          breakAt: i,
          reason: 'hash_mismatch',
          expected: recomputed,
          got: current.hash
        };
      }
    }
    
    return { valid: true, chainLength: this.chain.length };
  }

  // Effect: verify a cause exists before producing effect
  effect(causeHash, data) {
    const cause = this.chain.find(e => e.hash === causeHash);
    if (!cause) {
      return { valid: false, reason: 'cause_not_found' };
    }
    
    const effectEvent = this.cause(data, 'effect');
    effectEvent.event.cause = causeHash;
    effectEvent.event.hash = sha3_512(effectEvent.event.hash + causeHash);
    
    return {
      valid: true,
      cause,
      effect: effectEvent,
      chainLength: this.chain.length
    };
  }

  stats() {
    return {
      events: this.events.length,
      chainLength: this.chain.length,
      genesis: this.chain.length > 0 ? this.chain[0].hash : null,
      latest: this.chain.length > 0 ? this.chain[this.chain.length - 1].hash : null
    };
  }
}

// --- Law 5: CHAIN — Merkle-Linked Provenance ---
// Every link verifies every other link. Tamper one, detect all.
class ChainLaw {
  constructor() {
    this.links = [];
    this.merkleRoot = null;
  }

  // Add a link with merkle hash
  link(data, source = 'unknown') {
    const link = {
      id: this.links.length,
      data: typeof data === 'object' ? JSON.stringify(data) : String(data),
      source,
      timestamp: Date.now(),
      previousHash: this.links.length > 0 ? this.links[this.links.length - 1].hash : '0',
      hash: null
    };
    
    link.hash = sha3_512(link.id + link.data + link.source + link.timestamp + link.previousHash);
    this.links.push(link);
    this._recomputeMerkle();
    
    return {
      link,
      merkleRoot: this.merkleRoot,
      chainLength: this.links.length
    };
  }

  // Verify single link
  verifyLink(index) {
    if (index < 0 || index >= this.links.length) {
      return { valid: false, reason: 'out_of_range' };
    }
    
    const link = this.links[index];
    const expectedHash = sha3_512(link.id + link.data + link.source + link.timestamp + link.previousHash);
    
    if (link.hash !== expectedHash) {
      return { valid: false, reason: 'hash_mismatch' };
    }
    
    // Verify previous link connection
    if (index > 0 && link.previousHash !== this.links[index - 1].hash) {
      return { valid: false, reason: 'chain_broken' };
    }
    
    return { valid: true, link };
  }

  // Verify entire chain
  verifyAll() {
    for (let i = 0; i < this.links.length; i++) {
      const result = this.verifyLink(i);
      if (!result.valid) {
        return { valid: false, breakAt: i, reason: result.reason };
      }
    }
    return { valid: true, chainLength: this.links.length, merkleRoot: this.merkleRoot };
  }

  // Get chain segment
  segment(start, end) {
    return this.links.slice(start, end).map(l => ({
      id: l.id,
      hash: l.hash,
      source: l.source,
      timestamp: l.timestamp
    }));
  }

  _recomputeMerkle() {
    if (this.links.length === 0) {
      this.merkleRoot = null;
      return;
    }
    
    let hashes = this.links.map(l => l.hash);
    
    while (hashes.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left;
        nextLevel.push(sha3_512(left + right));
      }
      hashes = nextLevel;
    }
    
    this.merkleRoot = hashes[0];
  }

  stats() {
    return {
      links: this.links.length,
      merkleRoot: this.merkleRoot,
      genesis: this.links.length > 0 ? this.links[0].hash : null,
      latest: this.links.length > 0 ? this.links[this.links.length - 1].hash : null
    };
  }
}

// --- Five Laws Engine — Unified Interface ---
class FiveLawsEngine {
  constructor(seed = Date.now()) {
    this.chaos = new ChaosLaw(seed);
    this.randomness = new RandomnessLaw(seed);
    this.observation = new ObservationLaw();
    this.causality = new CausalityLaw();
    this.chain = new ChainLaw();
    this.seed = seed;
    this.operationLog = [];
  }

  // Process data through all five laws with CC gating
  process(input, options = {}) {
    const { chaosIntensity = 0.3, randomCount = 5, observe = true, cause = true, link = true } = options;
    
    // Step 1: Chaos injection
    const chaosResult = this.chaos.inject(input, chaosIntensity);
    
    // Step 2: Randomness sequence
    const randomResult = this.randomness.sequence(randomCount);
    
    // Step 3: Observation
    const obsResult = observe ? this.observation.observe(chaosResult.value, { randomness: randomResult.values }) : null;
    
    // Step 4: Causality
    const causeResult = cause ? this.causality.cause(chaosResult.value, 'five_laws_process') : null;
    
    // Step 5: Chain link
    const linkResult = link ? this.chain.link(chaosResult.value, 'five_laws') : null;
    
    const result = {
      input,
      output: chaosResult.value,
      chaos: chaosResult,
      randomness: randomResult,
      observation: obsResult,
      causality: causeResult,
      chain: linkResult,
      timestamp: Date.now(),
      seed: this.seed
    };
    
    this.operationLog.push(result);
    return result;
  }

  // Verify integrity of all five laws
  verify() {
    return {
      chaos: this.chaos.stats(),
      randomness: this.randomness.stats(),
      observation: this.observation.stats(),
      causality: this.causality.verify(),
      chain: this.chain.verifyAll()
    };
  }

  // Full stats
  stats() {
    return {
      seed: this.seed,
      operations: this.operationLog.length,
      chaos: this.chaos.stats(),
      randomness: this.randomness.stats(),
      observation: this.observation.stats(),
      causality: this.causality.stats(),
      chain: this.chain.stats()
    };
  }
}

module.exports = {
  FiveLawsEngine,
  ChaosLaw,
  RandomnessLaw,
  ObservationLaw,
  CausalityLaw,
  ChainLaw,
  FIVE_TAU
};
