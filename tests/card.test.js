const test = require('node:test');
const assert = require('node:assert');
const CARD = require('../data/card.js');
const DB = require('../data/drugs.js');

function keys(o, p = '') {
  return Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object') ? keys(v, p + k + '.') : [p + k]);
}

test('every language has every string', () => {
  const base = keys(CARD.STR.zh).sort();
  for (const l of CARD.LANGS) assert.deepStrictEqual(keys(CARD.STR[l]).sort(), base, l);
});
test('all lists have labels', () => {
  for (const l of CARD.LANGS) {
    const T = CARD.STR[l];
    CARD.SLOTS.forEach(k => assert.ok(T.slot[k], l + ' slot ' + k));
    CARD.PURPOSES.forEach(k => assert.ok(T.purpose[k], l + ' purpose ' + k));
    CARD.COLORS.forEach(k => assert.ok(T.color[k], l + ' color ' + k));
    CARD.TOPICS.forEach(t => { t.variants.forEach(v => assert.ok(T.text[v.text], v.text)); assert.ok(T.text[t.fallback]); assert.ok(T.badge[t.badge]); });
    CARD.ALERTS.forEach(a => assert.ok(T.text[a.text], a.text));
  }
});
test('drug defaults are valid', () => {
  for (const d of DB) {
    assert.ok(CARD.PURPOSES.includes(d.purpose), d.id + ' purpose');
    d.slots.forEach(s => assert.ok(CARD.SLOTS.includes(s), d.id + ' slot ' + s));
  }
  Object.values(CARD.TAG_PURPOSE).concat(Object.values(CARD.KEY_PURPOSE)).forEach(p => assert.ok(CARD.PURPOSES.includes(p), p));
});
test('line format', () => {
  assert.strictEqual(CARD.LOOK_FMT.zh('white', 'round', 1, 'tab', '脈優'), '白色圓形 1 顆');
  assert.strictEqual(CARD.LOOK_FMT.zh('', '', 0.5, 'tab', '脈優'), '脈優 半顆');
  assert.strictEqual(CARD.LOOK_FMT.en('white', 'round', 1, 'tab', 'Norvasc'), '1 white round tablet');
  assert.strictEqual(CARD.LOOK_FMT.en('yellow', 'capsule', 2, 'tab', 'X'), '2 yellow capsules');
});
