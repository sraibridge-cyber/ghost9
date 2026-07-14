// A/B Test: Keyword-based vs Word-count-based domain scoring
// Tests which approach produces better μ for clean, coherent text

const { evaluate } = require('./src/coherence_calculus.js');

// Test cases: clean, coherent text that SHOULD pass the gate
const TEST_CASES = [
  {
    id: 'TC-1',
    desc: 'Factual reference (CI-6)',
    text: 'The Earth orbits the Sun at an average distance of approximately 93 million miles. This orbital period takes approximately 365.25 days to complete.',
    expectedQuality: 'high'
  },
  {
    id: 'TC-2',
    desc: 'Technical passage (CI-5)',
    text: 'The fundamental principle of information processing requires that all eight domains maintain coherence above the established threshold. Signal integrity, energy conservation, temporal stability, spatial grounding, cognitive alignment, ethical neutrality, declarative truth, and novelty detection must all resonate in harmony for the system to achieve resonance.',
    expectedQuality: 'high'
  },
  {
    id: 'TC-3',
    desc: 'Medium prose (CI-9)',
    text: 'All human beings deserve dignity and respect. The system must never cause harm, must be transparent in its decisions, and must protect individual privacy.',
    expectedQuality: 'high'
  },
  {
    id: 'TC-4',
    desc: 'Code comment (CI-12)',
    text: 'This function evaluates coherence across all eight domains using geometric mean. The threshold is set at 0.9995 for strict admission.',
    expectedQuality: 'high'
  },
  {
    id: 'TC-5',
    desc: 'Short factual (CI-11)',
    text: 'The kernel processes information through eight domains of coherence.',
    expectedQuality: 'medium'
  },
  {
    id: 'TC-6',
    desc: 'Structured data (CI-10)',
    text: 'Node ID: 42, Type: memory, Coherence: 0.95, Timestamp: 2026-07-05T23:00:00Z',
    expectedQuality: 'medium'
  },
  {
    id: 'TC-7',
    desc: 'Gibberish (should score low)',
    text: 'asdf qwer zxcv jklm uiop bnmv cxzl qwertyuiopasdfghjklzxcvbnm',
    expectedQuality: 'low'
  },
  {
    id: 'TC-8',
    desc: 'Single word (should block)',
    text: 'Hi',
    expectedQuality: 'low'
  }
];

function runABTest() {
  console.log('=== A/B TEST: Keyword vs Word-Count Domain Scoring ===\n');
  
  for (const tc of TEST_CASES) {
    const result = evaluate(tc.text);
    const domainScores = result.scores;
    
    console.log(`${tc.id}: ${tc.desc} [${tc.expectedQuality}]`);
    console.log(`  μ = ${result.mu.toFixed(6)} | Pass = ${result.pass ? 'YES' : 'NO'}`);
    console.log(`  D1: ${domainScores.D1?.toFixed(4)} | D2: ${domainScores.D2?.toFixed(4)} | D3: ${domainScores.D3?.toFixed(4)} | D4: ${domainScores.D4?.toFixed(4)}`);
    console.log(`  D5: ${domainScores.D5?.toFixed(4)} | D6: ${domainScores.D6?.toFixed(4)} | D7: ${domainScores.D7?.toFixed(4)} | D8: ${domainScores.D8?.toFixed(4)}`);
    console.log('');
  }
  
  // Summary statistics
  const highQuality = TEST_CASES.filter(tc => tc.expectedQuality === 'high');
  const mediumQuality = TEST_CASES.filter(tc => tc.expectedQuality === 'medium');
  const lowQuality = TEST_CASES.filter(tc => tc.expectedQuality === 'low');
  
  console.log('=== SUMMARY ===');
  console.log(`High quality text (${highQuality.length} cases):`);
  highQuality.forEach(tc => {
    const r = evaluate(tc.text);
    console.log(`  ${tc.id}: μ = ${r.mu.toFixed(4)} ${r.pass ? '✅ PASS' : '❌ BLOCK'}`);
  });
  
  console.log(`\nMedium quality text (${mediumQuality.length} cases):`);
  mediumQuality.forEach(tc => {
    const r = evaluate(tc.text);
    console.log(`  ${tc.id}: μ = ${r.mu.toFixed(4)} ${r.pass ? '✅ PASS' : '❌ BLOCK'}`);
  });
  
  console.log(`\nLow quality text (${lowQuality.length} cases):`);
  lowQuality.forEach(tc => {
    const r = evaluate(tc.text);
    console.log(`  ${tc.id}: μ = ${r.mu.toFixed(4)} ${r.pass ? '✅ PASS' : '❌ BLOCK'}`);
  });
}

runABTest();
