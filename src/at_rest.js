// === Ghost9 at-rest sealing (AES-256-GCM) ===
// Kernel state and the archive hold text (held sentences, archived nodes). Both are written sealed.
// The key is a 32-byte file created 0600 on first use. Override the path with GHOST9_KEY_FILE.
// Limit: the key sits in the same user account as the data. This protects copies of the data
// directory, not a compromised account. Phone builds need the Android Keystore (not done yet).
// A file that fails authentication, or is corrupt, throws. Callers must not overwrite it.
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const KEY_FILE = process.env.GHOST9_KEY_FILE || path.join(os.homedir(), '.ghost9', 'at_rest.key');
let cachedKey = null;

function sealedError(message) {
  const e = new Error(message);
  e.sealed = true;
  return e;
}

function loadKey() {
  if (cachedKey) return cachedKey;
  if (!fs.existsSync(KEY_FILE)) {
    fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true, mode: 0o700 });
    fs.writeFileSync(KEY_FILE, crypto.randomBytes(32), { mode: 0o600, flag: 'wx' });
  }
  const key = fs.readFileSync(KEY_FILE);
  if (key.length !== 32) throw sealedError('at-rest key must be 32 bytes');
  cachedKey = key;
  return key;
}

function isBox(x) {
  return x !== null && typeof x === 'object' && x.v === 1 && x.alg === 'aes-256-gcm' &&
    typeof x.iv === 'string' && typeof x.tag === 'string' && typeof x.ct === 'string';
}

function seal(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', loadKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return { v: 1, alg: 'aes-256-gcm', iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ct: ct.toString('base64') };
}

function open(box) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', loadKey(), Buffer.from(box.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(box.tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(box.ct, 'base64')), decipher.final()]).toString('utf8');
  } catch (err) {
    throw sealedError('sealed file failed authentication (wrong key or tampered)');
  }
}

// Returns the fallback when the file is missing. Legacy plaintext JSON is read as-is and re-sealed on the next write.
function readSealedJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!isBox(parsed)) return parsed;
  return JSON.parse(open(parsed));
}

function writeSealedJson(file, obj) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(seal(JSON.stringify(obj))), { mode: 0o600 });
  fs.renameSync(tmp, file);
}

module.exports = { readSealedJson, writeSealedJson, seal, open, isBox, KEY_FILE };
