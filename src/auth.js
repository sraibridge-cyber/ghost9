// ================================================================
// GHOST AUTH v1.0 — SCRAM-SHA3-512 + Ephemeral Tokens
// SEAL: 2026-06-13 Tulsa
// ================================================================
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.join(__dirname, '..', 'data', '.ghost', 'auth.json');
const TOKEN_SECRET = process.env.GHOST_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL = 3600;
const SCRAM_ITERATIONS = 4096;

function ensureAuthDir() {
  const dir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadAuth() {
  ensureAuthDir();
  if (!fs.existsSync(AUTH_FILE)) return { users: {}, sessions: {} };
  try { return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')); }
  catch { return { users: {}, sessions: {} }; }
}

function saveAuth(auth) {
  ensureAuthDir();
  const tmp = AUTH_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(auth, null, 2));
  fs.renameSync(tmp, AUTH_FILE);
}

function sha3_512(data) {
  return crypto.createHash('sha3-512').update(data).digest('hex');
}

function hmac(key, data) {
  return crypto.createHmac('sha3-512', key).update(data).digest('hex');
}

function generateNonce() {
  return crypto.randomBytes(32).toString('base64');
}

function saltAndHash(password, salt, iterations = SCRAM_ITERATIONS) {
  let hash = password + salt;
  for (let i = 0; i < iterations; i++) {
    hash = sha3_512(hash + salt + i.toString());
  }
  return hash;
}

function scramPhase1(username, clientNonce) {
  const auth = loadAuth();
  const user = auth.users[username];
  if (!user) {
    const fakeSalt = sha3_512(username + 'ghost');
    return {
      salt: fakeSalt,
      iterations: SCRAM_ITERATIONS,
      server_nonce: generateNonce(),
      challenge: sha3_512(fakeSalt + clientNonce + Date.now())
    };
  }
  const serverNonce = generateNonce();
  const challenge = sha3_512(user.salt + clientNonce + serverNonce);
  auth.sessions[clientNonce] = {
    username,
    serverNonce,
    challenge,
    created: Date.now(),
    used: false
  };
  saveAuth(auth);
  return {
    salt: user.salt,
    iterations: SCRAM_ITERATIONS,
    server_nonce: serverNonce,
    challenge
  };
}

function scramPhase2(username, clientNonce, clientProof) {
  const auth = loadAuth();
  const pending = auth.sessions[clientNonce];
  if (!pending || pending.used || Date.now() - pending.created > 60000) {
    return null;
  }
  const user = auth.users[username];
  if (!user || pending.username !== username) {
    return null;
  }
  const expectedProof = hmac(user.hash, pending.challenge);
  if (clientProof !== expectedProof) {
    return null;
  }
  pending.used = true;
  const token = generateEphemeralToken(username);
  const serverSignature = hmac(user.hash, clientProof);
  saveAuth(auth);
  return {
    server_signature: serverSignature,
    ephemeral_token: token
  };
}

function generateEphemeralToken(username) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL;
  const payload = `${username}:${exp}`;
  const sig = hmac(TOKEN_SECRET, payload);
  return `${Buffer.from(payload).toString('base64')}.${sig}`;
}

function verifyEphemeralToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  try {
    const payload = Buffer.from(parts[0], 'base64').toString('utf8');
    const [username, expStr] = payload.split(':');
    const exp = parseInt(expStr);
    if (Date.now() / 1000 > exp) return null;
    const expectedSig = hmac(TOKEN_SECRET, payload);
    if (parts[1] !== expectedSig) return null;
    return { username, exp };
  } catch {
    return null;
  }
}

function createUser(username, password) {
  const auth = loadAuth();
  if (auth.users[username]) return false;
  const salt = generateNonce();
  const hash = saltAndHash(password, salt);
  auth.users[username] = {
    salt,
    hash,
    created: Date.now(),
    last_login: null
  };
  saveAuth(auth);
  return true;
}

function requireAuth(req) {
  const authHeader = req.headers['authorization'] || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) return null;
  return verifyEphemeralToken(match[1]);
}

function validateText(text) {
  const errors = [];
  if (!text || typeof text !== 'string') {
    return { valid: false, errors: ['text must be a non-empty string'] };
  }
  if (text.length > 10000) {
    errors.push('text exceeds 10000 character limit');
  }
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 2000) {
    errors.push('text exceeds 2000 word limit');
  }
  if (text.includes('\0')) {
    errors.push('text contains null bytes');
  }
  try {
    Buffer.from(text, 'utf8').toString('utf8');
  } catch {
    errors.push('text contains invalid UTF-8 sequences');
  }
  const sanitized = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<<[^>]*>/g, '');
  if (errors.length > 0) {
    return { valid: false, errors, sanitized: null };
  }
  return { valid: true, errors: [], sanitized };
}

module.exports = {
  scramPhase1,
  scramPhase2,
  generateEphemeralToken,
  verifyEphemeralToken,
  requireAuth,
  createUser,
  validateText,
  SCRAM_ITERATIONS,
  TOKEN_TTL
};
