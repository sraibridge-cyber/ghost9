// Tests for src/cc_structure.js. Node >= 18, no dependencies.
// Usage: node tests/regression/cc_structure.js
'use strict';

const assert = require('assert');
const path = require('path');
const S = require(path.join(__dirname, '..', '..', 'src', 'cc_structure'));
const CC = require(path.join(__dirname, '..', '..', 'src', 'coherence_calculus'));

const W = { a: 0.25, b: 0.25, c: 0.25, d: 0.25 };
const pending = [];
const test = (name, fn) => pending.push({ name, fn });

test('interior: measured log-sensitivity equals the weight', () => {
  const scores = { a: 0.97, b: 0.91, c: 0.99, d: 0.6 };
  const sens = S.logSensitivities(scores, W);
  for (const k of Object.keys(W)) {
    assert.ok(Math.abs(sens[k].sensitivity - W[k]) < 1e-3, `${k}: ${sens[k].sensitivity} vs ${W[k]}`);
  }
});

test('unequal weights: sensitivity tracks each weight', () => {
  const w = { a: 0.5, b: 0.3, c: 0.2 };
  const sens = S.logSensitivities({ a: 0.8, b: 0.9, c: 0.7 }, w);
  assert.ok(Math.abs(sens.a.sensitivity - 0.5) < 1e-3);
  assert.ok(Math.abs(sens.b.sensitivity - 0.3) < 1e-3);
  assert.ok(Math.abs(sens.c.sensitivity - 0.2) < 1e-3);
});

test('zero score: current geometric mean collapses to 0 (documents the boundary)', () => {
  const mu = CC.weightedGeometricMean({ a: 0, b: 0.9, c: 0.9, d: 0.9 }, W);
  assert.strictEqual(mu, 0);
});

test('zero score: floored mu stays positive and finite', () => {
  const mu = S.muFloored({ a: 0, b: 0.9, c: 0.9, d: 0.9 }, W);
  assert.ok(mu > 0 && Number.isFinite(mu));
});

test('floored dimension reports zero sensitivity and is flagged', () => {
  const sens = S.logSensitivities({ a: 0, b: 0.9, c: 0.9, d: 0.9 }, W);
  assert.strictEqual(sens.a.floored, true);
  assert.strictEqual(sens.a.sensitivity, 0);
});

test('structuralCheck passes on balanced weights at interior scores', () => {
  const r = S.structuralCheck({ a: 0.97, b: 0.91, c: 0.99, d: 0.6 }, W);
  assert.strictEqual(r.ok, true);
  assert.ok(r.maxShare <= S.CONFIG.max_share);
});

test('structuralCheck fails when one weight dominates past max_share', () => {
  const w = { a: 0.6, b: 0.2, c: 0.2 };
  const r = S.structuralCheck({ a: 0.9, b: 0.9, c: 0.9 }, w, { maxShare: 0.5 });
  assert.strictEqual(r.ok, false);
  assert.ok(r.maxShare > 0.5);
});

test('structuralCheck flags a floored dimension', () => {
  const r = S.structuralCheck({ a: 0, b: 0.9, c: 0.9, d: 0.9 }, W);
  assert.strictEqual(r.ok, false);
  assert.deepStrictEqual(r.floored, ['a']);
});

test('weights that do not sum to 1 are rejected', () => {
  assert.throws(() => S.muFloored({ a: 0.9 }, { a: 0.5 }), /sum to 1/);
});

(async () => {
  let passed = 0;
  let failed = 0;
  for (const t of pending) {
    try { t.fn(); passed++; console.log(`  ok    ${t.name}`); }
    catch (err) { failed++; console.log(`  FAIL  ${t.name}\n        ${err.message}`); }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();
