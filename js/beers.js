/* Beers 2023 比對引擎（瀏覽器與 Node 皆可用） */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('../data/beers2023.js'));
  else root.Beers = factory(root.BEERS_2023);
})(this, function (B) {
  'use strict';

  function norm(s) { return String(s || '').trim().toLowerCase(); }

  /** 以學名、中文名或商品名找字典 key */
  function findKey(name) {
    var q = norm(name);
    if (!q) return null;
    if (B.LEXICON[q]) return q;
    for (var k in B.LEXICON) {
      var e = B.LEXICON[k];
      if (norm(e.zh) === q) return k;
      if (e.brand && e.brand.toLowerCase().split(/\s+/).indexOf(q) !== -1) return k;
    }
    return null;
  }

  function tagsOf(key) {
    var e = B.LEXICON[norm(key)];
    var tags = e ? e.tags.slice() : [];
    if (tags.some(function (t) { return B.CNS_TAGS.indexOf(t) !== -1; })) tags.push('cns');
    return tags;
  }

  function applies(renal) { return renal && renal.age != null && renal.age >= B.ageMin; }

  function crclOf(renal) {
    if (renal.crcl != null) return { v: renal.crcl, label: 'CrCl' };
    if (renal.egfr != null) return { v: renal.egfr, label: 'eGFR（代 CrCl）' };
    return null;
  }

  function renalBelow(renal, x) {
    if (renal.dialysis) return true;
    var v = renal.egfr != null ? renal.egfr : renal.crcl;
    return v != null && v < x;
  }

  /** 單一藥物：回傳 findings（kind: 'beers'） */
  function evaluate(key, renal) {
    if (!applies(renal)) return [];
    var tags = tagsOf(key);
    if (!tags.length) return [];
    var out = [];
    B.ITEMS.forEach(function (it) {
      if (!it.tags.some(function (t) { return tags.indexOf(t) !== -1; })) return;
      if (it.minAge && renal.age < it.minAge) return;
      var prefix = '【Beers 2023 表' + it.table + '｜' + it.rec + '】';
      if (it.crcl) {
        var c = renal.dialysis ? { v: 0, label: '透析' } : crclOf(renal);
        if (!c) return;
        if (it.crcl.min != null && c.v < it.crcl.min) return;
        if (it.crcl.max != null && c.v >= it.crcl.max) return;
        prefix += '（' + c.label + (renal.dialysis ? '' : ' ' + Math.round(c.v)) + '）';
      }
      out.push({ kind: 'beers', table: it.table, level: it.level, clinician: prefix + it.clinician, patient: it.patient });
    });
    return out;
  }

  /**
   * 整份清單交互作用。items: [{ key, name }]（name 為顯示用名稱）
   * 回傳 [{ level, names, clinician, patient }]
   */
  function interactions(items, renal) {
    if (!applies(renal)) return [];
    var withTags = items.map(function (it) { return { key: it.key, name: it.name, tags: tagsOf(it.key) }; });
    var has = function (d, list) { return list.some(function (t) { return d.tags.indexOf(t) !== -1; }); };
    var out = [];
    B.INTERACTIONS.forEach(function (rule) {
      var w = rule.when || {};
      if (w.renalBelow != null && !renalBelow(renal, w.renalBelow)) return;
      if (w.sex && renal.sex !== w.sex) return;
      var involved;
      if (rule.type === 'pair') {
        var A = withTags.filter(function (d) { return has(d, rule.a); });
        var Bs = withTags.filter(function (d) { return has(d, rule.b); });
        if (!A.length || !Bs.length) return;
        involved = A.concat(Bs.filter(function (x) { return A.indexOf(x) === -1; }));
        if (involved.length < 2) return; // 同一顆藥同時屬於兩類不算交互作用
      } else if (rule.type === 'count') {
        involved = withTags.filter(function (d) { return d.tags.indexOf(rule.tag) !== -1; });
        if (involved.length < rule.min) return;
      } else return;
      out.push({
        id: rule.id, level: rule.level, names: involved.map(function (d) { return d.name; }),
        clinician: '【Beers 2023 表5｜' + rule.rec + '】' + rule.clinician, patient: rule.patient
      });
    });
    return out;
  }

  return { data: B, findKey: findKey, tagsOf: tagsOf, evaluate: evaluate, interactions: interactions, applies: applies };
});
