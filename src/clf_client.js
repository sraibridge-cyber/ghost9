// === Ghost9 classifier client (QC stage) ===
// Talks to the local Python service in services/clf over loopback HTTP.
// Node built-ins only. Never throws on a runtime failure: callers get
// { ok: false, error } and decide what that means (see prefilter.js).
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const LOCAL_AGENT = new http.Agent({ keepAlive: false });
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'clf.json'), 'utf8'));
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);
if (!LOOPBACK.has(new URL(CONFIG.url).hostname)) {
  throw new Error(`clf url must be loopback, got ${CONFIG.url}`);
}

function postScore(texts, opts = {}) {
  const url = new URL(opts.url || CONFIG.url);
  const body = JSON.stringify({ texts });
  const timeoutMs = opts.timeoutMs || CONFIG.timeout_ms;
  return new Promise(resolve => {
    const req = http.request({
      agent: LOCAL_AGENT,
      hostname: url.hostname,
      port: url.port,
      path: '/score',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: timeoutMs,
    }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) return resolve({ ok: false, error: `http_${res.statusCode}` });
        try {
          const parsed = JSON.parse(data);
          if (!Array.isArray(parsed.scores) || parsed.scores.length !== texts.length) {
            return resolve({ ok: false, error: 'bad_response_shape' });
          }
          resolve({ ok: true, scores: parsed.scores, model: parsed.model });
        } catch (err) {
          resolve({ ok: false, error: 'bad_json' });
        }
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', err => resolve({ ok: false, error: err.code || err.message }));
    req.end(body);
  });
}

function classify(text, opts = {}) {
  return postScore([text], opts);
}

module.exports = { postScore, classify, config: CONFIG };
