#!/usr/bin/env node
//================================================================
// OP3 EMPIRICAL ANALYSIS — GHOST v9.0.9
// Corrected |W_v3| = sqrt(n² + 16) / 17
// CSV W_magnitude is IGNORED — recomputed from n
// SEAL: 2026-06-13 Tulsa
//================================================================
'use strict';

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'data', 'session_log.csv');
const OUT_FILE = path.join(__dirname, '..', 'data', 'op3_analysis.json');

const W_DENOM = 17;
const W_IM = 4;

// CORRECT formula: |W_v3(n)| = sqrt(n² + 16) / 17
function correctW(n) {
  return Math.sqrt(n * n + W_IM * W_IM) / W_DENOM;
}

// OLD (wrong) formula from CSV: appears to be n/17 for small n, or something else
// We derive it from the CSV data to show the error
function oldW(n, csvW) {
  return csvW; // Just use what the CSV has
}

function parseCSV() {
  if (!fs.existsSync(LOG_FILE)) {
    console.error('No session_log.csv found. Run op3_harness.js first.');
    process.exit(1);
  }
  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n');
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const n = parseInt(cols[1]);
    const csvW = parseFloat(cols[2]);
    return {
      timestamp: parseInt(cols[0]),
      n: n,
      W_magnitude: csvW,           // what the CSV claims (old wrong formula)
      W_corrected: correctW(n),     // correct formula
      W_error: ((csvW - correctW(n)) / correctW(n) * 100).toFixed(1), // % error
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
  const avgW_old = data.reduce((s, d) => s + d.W_magnitude, 0) / N;
  const avgW_new = data.reduce((s, d) => s + d.W_corrected, 0) / N;

  const sumP = data.reduce((s, d) => s + d.P, 0);
  const yMean = sumP / N;
  const ssTot = data.reduce((s, d) => s + (d.P - yMean) ** 2, 0);

  // OLD |W| stats (from CSV)
  const sumW_old = data.reduce((s, d) => s + d.W_magnitude, 0);
  const sumW2_old = data.reduce((s, d) => s + d.W_magnitude ** 2, 0);
  const sumWP_old = data.reduce((s, d) => s + d.W_magnitude * d.P, 0);
  const denom_old = N * sumW2_old - sumW_old ** 2;
  const a_old = denom_old !== 0 ? (N * sumWP_old - sumW_old * sumP) / denom_old : 0;
  const b_old = denom_old !== 0 ? (sumP - a_old * sumW_old) / N : 0;
  const ssRes_old = data.reduce((s, d) => s + (d.P - (a_old * d.W_magnitude + b_old)) ** 2, 0);
  const r2_old = ssTot !== 0 ? 1 - ssRes_old / ssTot : 0;

  // NEW |W| stats (corrected)
  const sumW_new = data.reduce((s, d) => s + d.W_corrected, 0);
  const sumW2_new = data.reduce((s, d) => s + d.W_corrected ** 2, 0);
  const sumWP_new = data.reduce((s, d) => s + d.W_corrected * d.P, 0);
  const denom_new = N * sumW2_new - sumW_new ** 2;
  const a_new = denom_new !== 0 ? (N * sumWP_new - sumW_new * sumP) / denom_new : 0;
  const b_new = denom_new !== 0 ? (sumP - a_new * sumW_new) / N : 0;
  const ssRes_new = data.reduce((s, d) => s + (d.P - (a_new * d.W_corrected + b_new)) ** 2, 0);
  const r2_new = ssTot !== 0 ? 1 - ssRes_new / ssTot : 0;

  // Pearson r old
  const stdW_old = Math.sqrt(data.reduce((s, d) => s + (d.W_magnitude - avgW_old) ** 2, 0) / N);
  const stdP = Math.sqrt(data.reduce((s, d) => s + (d.P - avgP) ** 2, 0) / N);
  const cov_old = data.reduce((s, d) => s + (d.W_magnitude - avgW_old) * (d.P - avgP), 0) / N;
  const pearsonR_old = stdW_old * stdP !== 0 ? cov_old / (stdW_old * stdP) : 0;

  // Pearson r new
  const stdW_new = Math.sqrt(data.reduce((s, d) => s + (d.W_corrected - avgW_new) ** 2, 0) / N);
  const cov_new = data.reduce((s, d) => s + (d.W_corrected - avgW_new) * (d.P - avgP), 0) / N;
  const pearsonR_new = stdW_new * stdP !== 0 ? cov_new / (stdW_new * stdP) : 0;

  return {
    N, avgP, avgW_old, avgW_new,
    a_old, b_old, r2_old, pearsonR_old,
    a_new, b_new, r2_new, pearsonR_new,
    raw_data: data
  };
}

const data = parseCSV();
const stats = computeStats(data);

// Show error analysis for first few sessions
console.log('===============================================================');
console.log('OP3 EMPIRICAL ANALYSIS — GHOST v9.0.9');
console.log('===============================================================');
console.log(`Sessions: ${stats.N}`);
console.log(`Avg P (accuracy): ${stats.avgP.toFixed(4)}`);
console.log('');
console.log('SAMPLE |W| ERROR ANALYSIS (first 10 sessions):');
console.log('n\tCSV |W|\tCorrect |W|\tError %');
console.log('---------------------------------------------------------------');
stats.raw_data.slice(0, 10).forEach(d => {
  console.log(`${d.n}\t${d.W_magnitude.toFixed(4)}\t${d.W_corrected.toFixed(4)}\t\t${d.W_error}%`);
});
console.log('');
console.log('OLD |W| (from CSV — wrong formula):');
console.log(`  Avg |W|: ${stats.avgW_old.toFixed(6)}`);
console.log(`  Slope: ${stats.a_old.toFixed(6)}`);
console.log(`  R²: ${stats.r2_old.toFixed(4)}`);
console.log(`  Pearson r: ${stats.pearsonR_old.toFixed(4)}`);
console.log('');
console.log('CORRECTED |W| = sqrt(n²+16)/17:');
console.log(`  Avg |W|: ${stats.avgW_new.toFixed(6)}`);
console.log(`  Slope: ${stats.a_new.toFixed(6)}`);
console.log(`  R²: ${stats.r2_new.toFixed(4)}`);
console.log(`  Pearson r: ${stats.pearsonR_new.toFixed(4)}`);
console.log('===============================================================');

const report = {
  version: '9.0.9',
  cc_version: '3.0.9',
  timestamp: Date.now(),
  sessions: stats.N,
  avg_P: stats.avgP,
  W_v3_corrected: {
    avg_magnitude: stats.avgW_new,
    linear_fit: { a: stats.a_new, b: stats.b_new, r2: stats.r2_new },
    pearson_r: stats.pearsonR_new
  },
  W_v3_old_comparison: {
    avg_magnitude: stats.avgW_old,
    linear_fit: { a: stats.a_old, b: stats.b_old, r2: stats.r2_old },
    pearson_r: stats.pearsonR_old
  },
  raw_data: stats.raw_data
};

fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));
console.log(`\nSaved to ${OUT_FILE}`);
