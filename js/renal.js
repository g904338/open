/* 腎功能計算與藥品規則判斷（純函式，瀏覽器與 Node 皆可使用） */
(function (root) {
  'use strict';

  /** Cockcroft-Gault 肌酸酐清除率 (mL/min)。仿單劑量調整多以 CrCl 為準。 */
  function cockcroftGault(age, weightKg, scr, sex) {
    if (!(age > 0 && weightKg > 0 && scr > 0)) return null;
    var v = ((140 - age) * weightKg) / (72 * scr);
    if (sex === 'F') v *= 0.85;
    return Math.max(0, v);
  }

  /** CKD-EPI 2021（不含種族係數）eGFR (mL/min/1.73m²) */
  function ckdEpi2021(scr, age, sex) {
    if (!(age > 0 && scr > 0)) return null;
    var female = sex === 'F';
    var k = female ? 0.7 : 0.9;
    var a = female ? -0.241 : -0.302;
    var r = scr / k;
    var v = 142 * Math.pow(Math.min(r, 1), a) * Math.pow(Math.max(r, 1), -1.2) * Math.pow(0.9938, age);
    if (female) v *= 1.012;
    return v;
  }

  /** KDIGO GFR 分期 */
  function ckdStage(egfr) {
    if (egfr == null) return null;
    if (egfr >= 90) return { code: 'G1', label: '正常或偏高', plain: '腎功能正常' };
    if (egfr >= 60) return { code: 'G2', label: '輕度下降', plain: '腎功能輕度下降' };
    if (egfr >= 45) return { code: 'G3a', label: '輕至中度下降', plain: '腎功能輕至中度下降' };
    if (egfr >= 30) return { code: 'G3b', label: '中至重度下降', plain: '腎功能中至重度下降' };
    if (egfr >= 15) return { code: 'G4', label: '重度下降', plain: '腎功能重度下降' };
    return { code: 'G5', label: '腎衰竭', plain: '腎功能衰竭' };
  }

  /**
   * 整理病人腎功能。input:
   *  { age, sex, weight, scr, mode: 'calc'|'direct', egfr, crcl, dialysis }
   */
  function assessRenal(input) {
    var p = input || {};
    var out = { age: p.age, sex: p.sex, weight: p.weight, scr: p.scr, dialysis: !!p.dialysis, egfr: null, crcl: null, source: {} };
    if (p.mode === 'direct') {
      if (p.egfr > 0) { out.egfr = p.egfr; out.source.egfr = '直接輸入'; }
      if (p.crcl > 0) { out.crcl = p.crcl; out.source.crcl = '直接輸入'; }
    } else {
      var e = ckdEpi2021(p.scr, p.age, p.sex);
      var c = cockcroftGault(p.age, p.weight, p.scr, p.sex);
      if (e != null) { out.egfr = e; out.source.egfr = 'CKD-EPI 2021'; }
      if (c != null) { out.crcl = c; out.source.crcl = 'Cockcroft-Gault'; }
    }
    out.stage = out.dialysis ? { code: 'G5D', label: '透析中', plain: '目前接受透析治療' } : ckdStage(out.egfr != null ? out.egfr : out.crcl);
    out.hasRenal = out.dialysis || out.egfr != null || out.crcl != null;
    return out;
  }

  /** 取得規則需要的腎功能數值；缺少時以另一指標替代並標示 */
  function metricValue(renal, metric) {
    var want = metric === 'egfr' ? 'egfr' : 'crcl';
    var alt = want === 'egfr' ? 'crcl' : 'egfr';
    if (renal[want] != null) return { value: renal[want], metric: want, substituted: false };
    if (renal[alt] != null) return { value: renal[alt], metric: alt, substituted: true };
    return null;
  }

  function cmp(a, op, b) {
    if (a == null) return false;
    switch (op) {
      case '>=': return a >= b;
      case '>': return a > b;
      case '<=': return a <= b;
      case '<': return a < b;
      default: return false;
    }
  }

  var LEVEL_RANK = { ok: 0, caution: 1, adjust: 2, avoid: 3 };

  /**
   * 依病人狀況評估單一藥品，回傳應顯示的提醒。
   * 回傳 { level, findings: [{kind, level, clinician, patient}] }
   */
  function evaluateDrug(drug, renal) {
    var findings = [];
    var r = drug.renal;

    if (r && renal.hasRenal) {
      if (renal.dialysis && r.dialysis) {
        findings.push({ kind: 'renal', level: r.dialysis.level, clinician: '【透析】' + r.dialysis.clinician, patient: r.dialysis.patient });
      } else {
        var mv = metricValue(renal, r.metric);
        if (mv) {
          var tier = null;
          for (var i = 0; i < r.tiers.length; i++) {
            var t = r.tiers[i];
            var okMin = t.min == null || mv.value >= t.min;
            var okMax = t.max == null || mv.value < t.max;
            if (okMin && okMax) { tier = t; break; }
          }
          if (tier) {
            var label = (mv.metric === 'egfr' ? 'eGFR ' : 'CrCl ') + Math.round(mv.value);
            var note = mv.substituted ? '（仿單以 ' + (r.metric === 'egfr' ? 'eGFR' : 'CrCl') + ' 判斷，目前以 ' + (mv.metric === 'egfr' ? 'eGFR' : 'CrCl') + ' 代替）' : '';
            findings.push({ kind: 'renal', level: tier.level, clinician: '【' + label + '】' + tier.clinician + note, patient: tier.patient || '' });
          }
        }
      }
    }

    (drug.rules || []).forEach(function (rule) {
      if (rule.type !== 'countCriteria') return;
      var hit = rule.criteria.filter(function (c) { return cmp(renal[c.field], c.op, c.value); });
      if (hit.length >= rule.need) {
        findings.push({ kind: 'rule', level: rule.level, clinician: rule.clinician + '（符合：' + hit.map(function (c) { return c.label; }).join('、') + '）', patient: rule.patient || '' });
      }
    });

    if (drug.elderly && renal.age >= (drug.elderly.ageMin || 65)) {
      findings.push({ kind: 'elderly', level: drug.elderly.level || 'caution', clinician: '【≥' + (drug.elderly.ageMin || 65) + ' 歲】' + drug.elderly.clinician, patient: drug.elderly.patient || '' });
    }

    var level = findings.reduce(function (m, f) { return LEVEL_RANK[f.level] > LEVEL_RANK[m] ? f.level : m; }, 'ok');
    return { level: level, findings: findings };
  }

  var api = { cockcroftGault: cockcroftGault, ckdEpi2021: ckdEpi2021, ckdStage: ckdStage, assessRenal: assessRenal, evaluateDrug: evaluateDrug, LEVEL_RANK: LEVEL_RANK };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Renal = api;
})(this);
