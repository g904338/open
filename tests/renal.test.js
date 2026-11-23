const test = require('node:test');
const assert = require('node:assert');
const R = require('../js/renal.js');
const DB = require('../data/drugs.js');
const get = id => DB.find(d => d.id === id);

test('Cockcroft-Gault', () => {
  assert.strictEqual(Math.round(R.cockcroftGault(80, 60, 1.2, 'M')), 42);
  assert.strictEqual(Math.round(R.cockcroftGault(80, 60, 1.2, 'F')), 35);
});
test('CKD-EPI 2021', () => {
  // 參考值：男 60 歲 Scr 1.0 ≈ 86
  assert.ok(Math.abs(R.ckdEpi2021(1.0, 60, 'M') - 86) < 1.5);
});
test('metformin eGFR 35 → adjust, 25 → avoid', () => {
  assert.strictEqual(R.evaluateDrug(get('metformin'), R.assessRenal({ mode: 'direct', egfr: 35, age: 50 })).level, 'adjust');
  assert.strictEqual(R.evaluateDrug(get('metformin'), R.assessRenal({ mode: 'direct', egfr: 25, age: 50 })).level, 'avoid');
});
test('apixaban 2-of-3 rule', () => {
  const r = R.assessRenal({ mode: 'calc', age: 82, weight: 58, scr: 1.0, sex: 'M' });
  const ev = R.evaluateDrug(get('apixaban'), r);
  assert.ok(ev.findings.some(f => f.kind === 'rule'));
});
test('dialysis uses dialysis rule', () => {
  const ev = R.evaluateDrug(get('dabigatran'), R.assessRenal({ mode: 'direct', dialysis: true, age: 60 }));
  assert.strictEqual(ev.level, 'avoid');
});
test('all drugs have required fields', () => {
  for (const d of DB) for (const k of ['id','generic','use','howTo','sideEffects','warnings','seekHelp']) assert.ok(d[k], d.id + ' ' + k);
});
