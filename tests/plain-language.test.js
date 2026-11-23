// 檢查「會印在衛教單上」的文字沒有專業術語
const test = require('node:test');
const assert = require('node:assert');
const DB = require('../data/drugs.js');
const B = require('../data/beers2023.js');
const { TIPS } = require('../data/tips.js');

const JARGON = ['eGFR', 'CrCl', 'NSAID', '抗凝血', '中樞', '酮酸', '乳酸', '胰臟炎', '磺醯脲', '侵入性', '肌腱', '抗膽鹼',
  '鉀離子', '禁用', '適應症', '監測', '腎絲球', '清除率', '代謝', '顯影劑', '電解質', '低血鈉', '高血鉀', '透析', '劑量',
  '處方', '併用', '服用', '潰瘍', 'Beers', '泌尿道', '譫妄', '鴉片'];

function patientTexts() {
  const out = [];
  for (const d of DB) {
    out.push(['use', d.use], ['howTo', d.howTo]);
    for (const k of ['sideEffects', 'warnings', 'seekHelp']) d[k].forEach(t => out.push([d.id + '.' + k, t]));
    if (d.renal) { d.renal.tiers.forEach(t => out.push([d.id + '.renal', t.patient])); if (d.renal.dialysis) out.push([d.id + '.dialysis', d.renal.dialysis.patient]); }
    (d.rules || []).forEach(r => out.push([d.id + '.rule', r.patient]));
    if (d.elderly) out.push([d.id + '.elderly', d.elderly.patient]);
  }
  B.ITEMS.forEach(i => out.push([i.id, i.patient]));
  B.INTERACTIONS.forEach(i => out.push([i.id, i.patient]));
  Object.entries(B.LEXICON).forEach(([k, e]) => out.push([k + '.use', e.use]));
  TIPS.forEach(t => out.push([t.id, t.text]));
  return out;
}

test('patient-facing text has no jargon', () => {
  const bad = [];
  for (const [where, text] of patientTexts()) for (const j of JARGON) if (text && text.includes(j)) bad.push(`${where}: 「${j}」 in ${text}`);
  assert.deepStrictEqual(bad, []);
});
