const test = require('node:test');
const assert = require('node:assert');
const R = require('../js/renal.js');
const Beers = require('../js/beers.js');

const old = R.assessRenal({ mode: 'calc', age: 82, sex: 'M', weight: 58, scr: 1.6 });
const young = R.assessRenal({ mode: 'calc', age: 50, sex: 'M', weight: 58, scr: 1.6 });

test('benzodiazepine flagged only for >= 65', () => {
  assert.ok(Beers.evaluate('alprazolam', old).some(f => f.level === 'avoid'));
  assert.strictEqual(Beers.evaluate('alprazolam', young).length, 0);
});
test('no age → no Beers', () => {
  assert.strictEqual(Beers.evaluate('alprazolam', R.assessRenal({})).length, 0);
});
test('find by brand and Chinese name', () => {
  assert.strictEqual(Beers.findKey('Xanax'), 'alprazolam');
  assert.strictEqual(Beers.findKey('贊安諾'), 'alprazolam');
});
test('Table 6 renal rule uses CrCl', () => {
  const ok = R.assessRenal({ mode: 'direct', age: 70, crcl: 70 });
  const low = R.assessRenal({ mode: 'direct', age: 70, crcl: 40 });
  assert.ok(!Beers.evaluate('pregabalin', ok).some(f => f.table === 6));
  assert.ok(Beers.evaluate('pregabalin', low).some(f => f.table === 6));
});
test('dabigatran caution only >= 75', () => {
  assert.ok(Beers.evaluate('dabigatran', R.assessRenal({ age: 80 })).some(f => f.table === 4));
  assert.ok(!Beers.evaluate('dabigatran', R.assessRenal({ age: 70 })).some(f => f.table === 4));
});
test('interactions: >=3 CNS drugs, opioid + benzo', () => {
  const items = ['gabapentin', 'alprazolam', 'zolpidem'].map(k => ({ key: k, name: k }));
  assert.ok(Beers.interactions(items, old).some(x => x.id === 't5-cns3'));
  const ob = ['tramadol', 'lorazepam'].map(k => ({ key: k, name: k }));
  assert.ok(Beers.interactions(ob, old).some(x => x.id === 't5-opioid-benzo'));
  assert.strictEqual(Beers.interactions(ob, young).length, 0);
});
test('RAS + K-sparing needs reduced renal function', () => {
  const items = ['losartan', 'amiloride'].map(k => ({ key: k, name: k }));
  assert.ok(Beers.interactions(items, R.assessRenal({ mode: 'direct', age: 70, egfr: 40 })).some(x => x.id === 't5-ras-ksparing'));
  assert.ok(!Beers.interactions(items, R.assessRenal({ mode: 'direct', age: 70, egfr: 80 })).some(x => x.id === 't5-ras-ksparing'));
});
