#!/usr/bin/env node
//================================================================
// OP3 EMPIRICAL ANALYSIS — GHOST v9.0.8
//================================================================
'use strict';

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'data', 'session_log.csv');
const OUT_FILE = path.join(__dirname, '..', 'data', 'op3_analysis.json');

function parseCSV() {
  if (!fs.existsSync(LOG_FILE)) {
    console.error('No session_log.csv found. Run op3_harness.js first.');
    process.exit(1);
  }
  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n');
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    return {
      timestamp: parseInt(cols[0]),
      n: parseInt(cols[1]),
      W_magnitude: parseFloat(cols[2]),
      W_phase: parseFloat(cols[3]),
      P: parseFloat(cols[4]),
      correct: parseInt(cols[5]),
      total: parseInt(cols[6]),
      notes: cols[7] || ''
    };
  });
}

function computeStats(data) {
  const N = data.length;
  if (N === 0) return null;
  const avgP = data.reduce((s, d) => s + d.P, 0) / N;
  const avgW = data.reduce((s, d) => s + d.W_magnitude, 0) / N;
  const sumW = data.reduce((s, d) => s + d.W_magnitude, 0);
  const sumP = data.reduce((s, d) => s + d.P, 0);
  const sumW2 = data.reduce((s, d) => s + d.W_magnitude ** 2, 0);
  const sumWP = data.reduce((s, d) => s + d.W_magnitude * d.P, 0);
  const denom = N * sumW2 - sumW ** 2;
  const a = denom !== 0 ? (N * sumWP - sumW * sumP) / denom : 0;
  const b = denom !== 0 ? (sumP - a * sumW) / N : 0;
  const yMean = sumP / N;
  const ssTot = data.reduce((s, d) => s + (d.P - yMean) ** 2, 0);
  const ssRes = data.reduce((s, d) => s + (d.P - (a * d.W_magnitude + b)) ** 2, 0);
  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;
  const stdW = Math.sqrt(data.reduce((s, d) => s + (d.W_magnitude - avgW) ** 2, 0) / N);
  const stdP = Math.sqrt(data.reduce((s, d) => s + (d.P - avgP) ** 2, 0) / N);
  const cov = data.reduce((s, d) => s + (d.W_magnitude - avgW) * (d.P - avgP), 0) / N;
  const pearsonR = stdW * stdP !== 0 ? cov / (stdW * stdP) : 0;
  return { N, avgP, avgW, a, b, r2, pearsonR };
}

const data = parseCSV();
const stats = computeStats(data);

console.log('===============================================================');
console.log('  OP3 EMPIRICAL ANALYSIS — GHOST v9.0.8');
console.log('===============================================================');
console.log(`  Sessions:           ${stats.N}`);
console.log(`  Avg P (accuracy):   ${stats.avgP.toFixed(4)}`);
console.log(`  Avg |W_v3|:         ${stats.avgW.toFixed(6)}`);
console.log('');
console.log('  LINEAR FIT: P = a·|W| + b');
console.log(`    a (slope):        ${stats.a.toFixed(6)}`);
console.log(`    b (intercept):    ${stats.b.toFixed(6)}`);
console.log(`    R²:               ${stats.r2.toFixed(4)}`);
console.log(`    Pearson r:        ${stats.pearsonR.toFixed(4)}`);
console.log('===============================================================');

const report = {
  version: '9.0.8', cc_version: '3.0.8', timestamp: Date.now(),
  sessions: stats.N, avg_P: stats.avgP, avg_W_magnitude: stats.avgW,
  linear_fit: { a: stats.a, b: stats.b, r2: stats.r2 },
  pearson_r: stats.pearsonR, raw_data: data
};
fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));
console.log(`\nSaved to ${OUT_FILE}`);
