// thresholds.js — tier thresholds, loaded from config/thresholds.json.
// Every STM/LTM decision in the kernel reads these names. Do not hard-code tier numbers.
const fs = require('fs');
const path = require('path');

const RAW = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'thresholds.json'), 'utf8'));

function unit(key) {
  const v = RAW[key];
  if (typeof v !== 'number' || !(v > 0 && v <= 1)) {
    throw new Error(`config/thresholds.json: ${key} must be a number in (0, 1], got ${JSON.stringify(v)}`);
  }
  return v;
}

const STM_MIN = unit('stm_min');
const LTM_MIN = unit('ltm_min');
if (!(STM_MIN < LTM_MIN)) {
  throw new Error(`config/thresholds.json: stm_min (${STM_MIN}) must be below ltm_min (${LTM_MIN})`);
}

module.exports = Object.freeze({
  STM_MIN,
  LTM_MIN,
  FIVE_LAWS_TAU: unit('five_laws_tau'),
  BONSAI_LTM_TAU: unit('bonsai_ltm_tau'),
});
