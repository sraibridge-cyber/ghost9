'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atrest-'));
process.env.GHOST9_KEY_FILE = path.join(dir, 'key');
const { readSealedJson, writeSealedJson, KEY_FILE } = require('../../src/at_rest');
let fails = 0;
function check(name, fn) {
  try { fn(); console.log('  ok    ' + name); }
  catch (e) { fails++; console.log('  FAIL  ' + name + ' :: ' + e.message); }
}
const SECRET = 'I hope someone breaks your legs for what you did';
check('key file is created 0600 on first use', () => {
  writeSealedJson(path.join(dir, 'x.json'), { a: 1 });
  assert.strictEqual(fs.statSync(KEY_FILE).mode & 0o777, 0o600);
  assert.strictEqual(fs.readFileSync(KEY_FILE).length, 32);
});
check('round trip returns the same object', () => {
  const f = path.join(dir, 'state.json');
  writeSealedJson(f, { nodes: [{ content: SECRET }], n: 1 });
  assert.deepStrictEqual(readSealedJson(f, null), { nodes: [{ content: SECRET }], n: 1 });
});
check('sealed file on disk holds no plaintext', () => {
  const f = path.join(dir, 'state.json');
  writeSealedJson(f, { nodes: [{ content: SECRET }] });
  assert.ok(!fs.readFileSync(f, 'utf8').includes('breaks your legs'));
  assert.strictEqual(fs.statSync(f).mode & 0o777, 0o600);
});
check('a tampered ciphertext fails loudly', () => {
  const f = path.join(dir, 'tamper.json');
  writeSealedJson(f, { a: 'secret' });
  const box = JSON.parse(fs.readFileSync(f, 'utf8'));
  const b = Buffer.from(box.ct, 'base64'); b[0] ^= 1; box.ct = b.toString('base64');
  fs.writeFileSync(f, JSON.stringify(box));
  assert.throws(() => readSealedJson(f, null), err => err.sealed === true);
});
check('a wrong key fails loudly, never returns the fallback', () => {
  const f = path.join(dir, 'wrongkey.json');
  writeSealedJson(f, { a: 'secret' });
  fs.writeFileSync(KEY_FILE, require('crypto').randomBytes(32));
  // The module caches its key, so reload it to pick up the new key file.
  delete require.cache[require.resolve('../../src/at_rest')];
  const fresh = require('../../src/at_rest');
  assert.throws(() => fresh.readSealedJson(f, null), err => err.sealed === true);
});
check('legacy plaintext JSON still loads', () => {
  const f = path.join(dir, 'legacy.json');
  fs.writeFileSync(f, JSON.stringify({ nodes: [], n: 0 }));
  assert.deepStrictEqual(readSealedJson(f, null), { nodes: [], n: 0 });
});
check('a missing file returns the fallback', () => {
  assert.strictEqual(readSealedJson(path.join(dir, 'nope.json'), 'fallback'), 'fallback');
});
check('a corrupt file throws instead of returning the fallback', () => {
  const f = path.join(dir, 'corrupt.json');
  fs.writeFileSync(f, '{not json');
  assert.throws(() => readSealedJson(f, null));
});
fs.rmSync(dir, { recursive: true, force: true });
console.log(fails ? `${fails} failed` : 'all passed');
process.exit(fails ? 1 : 0);
