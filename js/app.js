/* global DRUG_DB, Renal, Beers, CARD, Icons */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var LEVEL_TEXT = { ok: '無特別提醒', caution: '注意', adjust: '需調整', avoid: '避免使用', unknown: '未收錄' };
  var RANK = { unknown: -1, ok: 0, caution: 1, adjust: 2, avoid: 3 };
  var ZH = CARD.STR.zh;

  var selected = [];   // { type, id|key|name, color, shape, qty, unit, slots[], purpose }
  var pick = {};       // 勾選覆寫：topic/alert id -> boolean
  var edited = {};     // 句子覆寫：topic/alert id -> 文字
  var lang = 'zh';
  var honTouched = false;
  var activeIdx = 0;

  /* ================= 小工具 ================= */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : null; }
  function norm(s) { return String(s || '').trim().toLowerCase(); }
  function dbById(id) { return DRUG_DB.find(function (d) { return d.id === id; }); }
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
  function radio(name) { var el = document.querySelector('input[name=' + name + ']:checked'); return el ? el.value : null; }
  function S() { return CARD.STR[lang]; }

  /* ================= 藥品資訊 ================= */
  function keyOf(s) {
    if (s.type === 'db') return dbById(s.id).generic.toLowerCase();
    if (s.type === 'lex') return s.key;
    return null;
  }
  function info(s) {
    if (s.type === 'db') {
      var d = dbById(s.id), b = d.brands[0];
      return { title: b ? b.zh : d.zh, en: b ? b.en : d.generic, generic: d.generic, sub: d.generic + ' ' + d.strength, d: d };
    }
    if (s.type === 'lex') {
      var e = Beers.data.LEXICON[s.key], parts = (e.brand || '').split(' ');
      var gen = s.key.replace(/(^|[\s-])\w/g, function (m) { return m.toUpperCase(); });
      return { title: e.brand ? parts[0] : e.zh, en: e.brand ? parts.slice(1).join(' ') : gen, generic: gen, sub: gen + (e.brand ? '（' + e.zh + '）' : ''), lexEntry: e };
    }
    return { title: s.name, en: s.name, generic: '', sub: '資料庫未收錄' };
  }
  function defaultPurpose(ref) {
    if (ref.type === 'db') return dbById(ref.id).purpose || 'other';
    if (ref.type === 'lex') {
      if (CARD.KEY_PURPOSE[ref.key]) return CARD.KEY_PURPOSE[ref.key];
      var tags = Beers.tagsOf(ref.key);
      for (var i = 0; i < tags.length; i++) if (CARD.TAG_PURPOSE[tags[i]]) return CARD.TAG_PURPOSE[tags[i]];
    }
    return 'other';
  }
  function withDefaults(ref) {
    var p = defaultPurpose(ref);
    var slots = ref.type === 'db' && dbById(ref.id).slots ? dbById(ref.id).slots.slice() : (CARD.PURPOSE_SLOTS[p] || ['ab']).slice();
    return Object.assign({ color: '', shape: '', qty: 1, unit: 'tab', slots: slots, purpose: p }, ref);
  }

  /* ================= 搜尋 ================= */
  var SEARCH_INDEX = (function () {
    var list = DRUG_DB.map(function (d) {
      return {
        ref: { type: 'db', id: d.id }, gen: d.generic, label: d.brands.map(function (b) { return b.zh + ' ' + b.en; }).join('、') || d.zh, cat: d.category,
        hay: [d.generic, d.zh, d.category].concat(d.brands.map(function (b) { return b.en + ' ' + b.zh; })).concat(d.nhiCode || []).join(' ').toLowerCase(),
        names: [d.generic, d.zh].concat(d.brands.map(function (b) { return b.en; })).concat(d.brands.map(function (b) { return b.zh; })).map(norm)
      };
    });
    var dbKeys = DRUG_DB.map(function (d) { return d.generic.toLowerCase(); });
    var seen = [];
    Object.keys(Beers.data.LEXICON).forEach(function (k) {
      var e = Beers.data.LEXICON[k];
      if (dbKeys.indexOf(k) !== -1 || seen.indexOf(e) !== -1) return;
      seen.push(e);
      list.push({
        ref: { type: 'lex', key: k }, gen: k, label: (e.brand ? e.brand + '・' : '') + e.zh, cat: e.use,
        hay: [k, e.zh, e.brand, e.use].join(' ').toLowerCase(),
        names: [k, e.zh].concat((e.brand || '').split(' ')).map(norm)
      });
    });
    return list;
  })();

  function search(q) {
    q = norm(q);
    if (!q) return [];
    var exact = [], starts = [], rest = [];
    SEARCH_INDEX.forEach(function (it) {
      if (it.names.indexOf(q) !== -1) exact.push(it);
      else if (it.names.some(function (n) { return n.indexOf(q) === 0; })) starts.push(it);
      else if (it.hay.indexOf(q) !== -1) rest.push(it);
    });
    return exact.concat(starts, rest).slice(0, 10);
  }
  function resolve(name) {
    var q = norm(name);
    var hit = SEARCH_INDEX.find(function (it) { return it.names.indexOf(q) !== -1; });
    if (hit) return hit.ref;
    var k = Beers.findKey(name);
    if (k) return { type: 'lex', key: k };
    var r = search(name);
    if (r.length === 1) return r[0].ref;
    return { type: 'custom', name: name.trim() };
  }
  function sameRef(a, b) { return a.type === b.type && a.id === b.id && a.key === b.key && a.name === b.name; }
  function addRef(ref) {
    if (selected.some(function (s) { return sameRef(s, ref); })) return false;
    selected.push(withDefaults(ref));
    return true;
  }

  /* ================= 病人 ================= */
  function readPatient() {
    var mode = radio('mode');
    var r = Renal.assessRenal({
      age: num('age'), sex: radio('sex'),
      weight: mode === 'calc' ? num('weight') : num('weightDirect'),
      scr: mode === 'calc' ? num('scr') : num('scrDirect'),
      mode: mode, egfr: num('egfrIn'), crcl: num('crclIn'), dialysis: $('dialysis').checked
    });
    r.surname = $('surname').value.trim();
    return r;
  }
  function syncHonorific(r) {
    var f = r.sex === 'F';
    $('honStd').textContent = f ? '女士' : '先生';
    $('honElder').textContent = f ? '阿嬤' : '阿公';
    if (!honTouched) document.querySelector('input[name=hon][value=' + (r.age >= 65 ? 'elder' : 'std') + ']').checked = true;
  }
  function honKey(r) { return radio('hon') === 'elder' ? (r.sex === 'F' ? 'GF' : 'GM') : (r.sex === 'F' ? 'F' : 'M'); }

  function isRenalImpaired(r) { return r.dialysis || !!(r.stage && ['G3a', 'G3b', 'G4', 'G5'].indexOf(r.stage.code) !== -1); }
  function renderRenal(r) {
    var parts = [];
    if (r.egfr != null) parts.push('eGFR <b>' + r.egfr.toFixed(1) + '</b>（' + r.source.egfr + '）');
    if (r.crcl != null) parts.push('CrCl <b>' + r.crcl.toFixed(1) + '</b> mL/min（' + r.source.crcl + '）');
    if (r.stage) parts.push('分期 <b>' + r.stage.code + '</b> ' + r.stage.label);
    if (radio('mode') === 'calc' && r.scr != null) {
      if (r.age == null) parts.push('<span class="muted">需要年齡才能計算</span>');
      else if (r.weight == null) parts.push('<span class="muted">填體重可另算 CrCl（多數仿單用 CrCl）</span>');
    }
    $('renalResult').innerHTML = parts.join('<br>');
    var v = r.egfr != null ? 'eGFR ' + Math.round(r.egfr) : r.crcl != null ? 'CrCl ' + Math.round(r.crcl) : '';
    $('renalBadge').textContent = r.dialysis ? '洗腎' : (v ? v + (r.stage ? ' · ' + r.stage.code : '') : '');
  }

  /* ================= 評估 ================= */
  function evaluateAll(r) {
    return selected.map(function (s) {
      var inf = info(s), findings = [];
      if (s.type === 'db') findings = Renal.evaluateDrug(inf.d, r).findings;
      var key = keyOf(s);
      if (key) findings = findings.concat(Beers.evaluate(key, r));
      var level = s.type === 'custom' ? 'unknown' : findings.reduce(function (m, f) { return RANK[f.level] > RANK[m] ? f.level : m; }, 'ok');
      return { s: s, inf: inf, key: key, findings: findings, level: level };
    });
  }

  /* ================= 規則 ================= */
  function context(r, evals, inter) {
    var groups = {};
    evals.forEach(function (e) {
      if (!e.key) return;
      var tags = Beers.tagsOf(e.key);
      Object.keys(CARD.GROUPS).forEach(function (g) {
        var G = CARD.GROUPS[g];
        if (G.keys.indexOf(e.key) !== -1 || G.tags.some(function (t) { return tags.indexOf(t) !== -1; })) groups[g] = true;
      });
    });
    var flagged = evals.filter(function (e) { return e.level === 'adjust' || e.level === 'avoid'; });
    var ctx = { elderly: r.age >= 65, renal: isRenalImpaired(r), count: evals.length, groups: groups, flagged: flagged, inter: inter };
    // 預設勾選上限：依優先順序取前幾項
    ctx.topicSug = CARD.TOPIC_PRIORITY.filter(function (id) {
      var t = CARD.TOPICS.find(function (x) { return x.id === id; });
      return t.variants.some(function (v) { return match(v.when, ctx); });
    }).slice(0, CARD.SUGGEST_LIMIT.topics);
    ctx.alertSug = CARD.ALERTS.filter(function (al) { return match(al.when, ctx); }).map(function (al) { return al.id; }).slice(0, CARD.SUGGEST_LIMIT.alerts);
    return ctx;
  }
  function match(w, ctx) {
    if (!w) return false;
    if (w.always) return true;
    if (w.elderly && ctx.elderly) return true;
    if (w.renal && ctx.renal) return true;
    if (w.manyDrugs && ctx.count >= w.manyDrugs) return true;
    if (w.flagged && (ctx.flagged.length || ctx.inter.length)) return true;
    if (w.groups && w.groups.some(function (g) { return ctx.groups[g]; })) return true;
    return false;
  }
  /** 主題：回傳 { suggested, keys[] } */
  function topicAuto(t, ctx) {
    var keys = t.variants.filter(function (v) { return match(v.when, ctx); }).map(function (v) { return v.text; });
    keys = uniq(keys).slice(0, t.max);
    return { suggested: ctx.topicSug.indexOf(t.id) !== -1, keys: keys.length ? keys : [t.fallback] };
  }
  /** 藥的描述（回診提醒用）：外觀（用途） */
  function drugDesc(s, L) {
    var T = CARD.STR[L], inf = info(s);
    var look = L === 'zh'
      ? (s.color ? T.color[s.color] : '') + (s.shape ? T.shape[s.shape] : '')
      : [s.color ? T.color[s.color] : '', s.shape ? T.shape[s.shape] : ''].filter(Boolean).join(' ');
    var p = T.purpose[s.purpose];
    if (!look) return L === 'zh' ? inf.title + '（' + p + '）' : inf.en + ' (' + p + ')';
    return L === 'zh' ? look + '（' + p + '）' : look + ' (' + p + ')';
  }
  function sentence(keys, L, ctx) {
    var T = CARD.STR[L];
    var sep = L === 'zh' ? '；' : '. ';
    return keys.map(function (k) {
      return T.text[k].replace('{drugs}', uniq(ctx.flagged.map(function (e) { return drugDesc(e.s, L); })).join(L === 'zh' ? '、' : ', '));
    }).join(sep);
  }
  function itemState(id, suggested) { return id in pick ? pick[id] : suggested; }

  /* ================= 左側：藥物清單 ================= */
  function opt(v, label, cur) { return '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + label + '</option>'; }

  function renderSelected(evals) {
    $('selected').innerHTML = evals.map(function (e, i) {
      var s = e.s;
      var colors = opt('', '顏色', s.color) + CARD.COLORS.map(function (c) { return opt(c, ZH.color[c], s.color); }).join('');
      var shapes = opt('', '形狀', s.shape) + CARD.SHAPES.map(function (c) { return opt(c, ZH.shape[c] || '其他', s.shape); }).join('');
      var qtys = CARD.QTYS.map(function (q) { return opt(q, CARD.QTY_FMT.zh(q, s.unit), s.qty); }).join('');
      var units = CARD.UNITS.map(function (u) { return opt(u, ZH.unit[u], s.unit); }).join('');
      var purposes = CARD.PURPOSES.map(function (p) { return opt(p, ZH.purpose[p], s.purpose); }).join('');
      var slots = CARD.SLOTS.map(function (k) {
        var on = s.slots.indexOf(k) !== -1;
        return '<button type="button" class="slot' + (on ? ' on' : '') + '" data-i="' + i + '" data-slot="' + k + '" aria-pressed="' + on + '">' + ZH.slot[k] + '</button>';
      }).join('');
      return '<li>' +
        '<div class="dr-head"><span class="nm"><b>' + esc(e.inf.title) + '</b> ' + esc(e.inf.en !== e.inf.title ? e.inf.en : '') + '<small>' + esc(e.inf.sub) + '</small></span>' +
        '<span class="lv lv-' + e.level + '">' + LEVEL_TEXT[e.level] + '</span>' +
        '<button class="rm" data-rm="' + i + '" title="移除" aria-label="移除 ' + esc(e.inf.title) + '">×</button></div>' +
        '<div class="dr-edit"><span class="pv">' + Icons.pill(s.color, s.shape, '外觀預覽') + '</span>' +
        '<select data-i="' + i + '" data-f="color" aria-label="顏色">' + colors + '</select>' +
        '<select data-i="' + i + '" data-f="shape" aria-label="形狀">' + shapes + '</select>' +
        '<select data-i="' + i + '" data-f="qty" aria-label="每次顆數">' + qtys + '</select>' +
        '<select data-i="' + i + '" data-f="unit" aria-label="單位">' + units + '</select>' +
        '<select data-i="' + i + '" data-f="purpose" aria-label="用途" class="wide">' + purposes + '</select>' +
        '</div><div class="slots">' + slots + '</div></li>';
    }).join('');
    $('drugEmpty').classList.toggle('hidden', evals.length > 0);
    $('drugCount').textContent = evals.length ? '共 ' + evals.length + ' 種' : '';
  }

  /* ================= 左側：列印內容 ================= */
  function renderPickers(ctx) {
    $('topicList').innerHTML = CARD.TOPICS.map(function (t) {
      var a = topicAuto(t, ctx), on = itemState(t.id, a.suggested);
      var text = t.id in edited ? edited[t.id] : sentence(a.keys, 'zh', ctx);
      return '<div class="pick' + (on ? '' : ' off') + '"><input type="checkbox" id="pk-' + t.id + '" data-pick="' + t.id + '"' + (on ? ' checked' : '') + '>' +
        '<label for="pk-' + t.id + '" class="pbadge">' + Icons.icon(t.badge) + ZH.badge[t.badge] + '</label>' +
        '<input type="text" class="ptext" id="pt-' + t.id + '" data-edit="' + t.id + '" value="' + esc(text) + '" aria-label="' + ZH.badge[t.badge] + '的句子">' +
        '<span class="sugg' + (a.suggested ? '' : ' ghost') + '">建議</span></div>';
    }).join('');
    $('alertList').innerHTML = CARD.ALERTS.map(function (al) {
      var sug = ctx.alertSug.indexOf(al.id) !== -1, on = itemState(al.id, sug);
      var text = al.id in edited ? edited[al.id] : ZH.text[al.text];
      return '<div class="pick alert-pick' + (on ? '' : ' off') + '"><input type="checkbox" id="pk-' + al.id + '" data-pick="' + al.id + '"' + (on ? ' checked' : '') + ' aria-label="印出這項注意事項">' +
        '<input type="text" class="ptext" id="pt-' + al.id + '" data-edit="' + al.id + '" value="' + esc(text) + '" aria-label="注意事項">' +
        '<span class="sugg' + (sug ? '' : ' ghost') + '">建議</span></div>';
    }).join('');
  }
  function renderLangChips() {
    $('langChips').innerHTML = CARD.LANGS.map(function (l) {
      return '<button type="button" class="chip' + (l === lang ? ' on' : '') + '" data-lang="' + l + '" aria-pressed="' + (l === lang) + '">' + CARD.STR[l].langName + (l === 'zh' ? '（預設）' : '') + '</button>';
    }).join('');
    var hasEdit = Object.keys(edited).length > 0;
    $('langNote').classList.toggle('hidden', lang === 'zh');
    $('langNote').textContent = '外文翻譯稿尚待母語人士核對。' + (hasEdit ? '修改過的句子會照中文原文印出。' : '');
  }

  /* ================= 藥師提醒 ================= */
  function renderAlerts(r, evals, inter) {
    var html = '';
    if (!evals.length) html = '<p class="muted">尚未加入藥物。</p>';
    else {
      var notes = [];
      if (r.age == null) notes.push('未填年齡，未做 Beers 老人用藥判斷。');
      else if (r.age < 65) notes.push('未滿 65 歲，不適用 Beers 準則。');
      if (!r.hasRenal) notes.push('未提供腎功能，未做腎功能劑量判斷。');
      if (notes.length) html += '<p class="muted small">' + notes.join('<br>') + '</p>';
      if (inter.length) {
        html += '<h3 class="alert-sec">藥物併用（Beers 表 5）</h3>';
        inter.forEach(function (x) {
          html += '<div class="alert lv-' + x.level + '"><div class="t">' + x.names.map(esc).join(' ＋ ') + '<span class="lv lv-' + x.level + '">' + LEVEL_TEXT[x.level] + '</span></div>' + esc(x.clinician) + '</div>';
        });
      }
      html += '<h3 class="alert-sec">個別藥品</h3>';
      evals.slice().sort(function (a, b) { return RANK[b.level] - RANK[a.level]; }).forEach(function (e) {
        html += '<div class="alert lv-' + e.level + '"><div class="t">' + esc(e.inf.title) + ' ' + esc(e.inf.en !== e.inf.title ? e.inf.en : '') + ' <small class="muted">' + esc(e.inf.generic) + '</small><span class="lv lv-' + e.level + '">' + LEVEL_TEXT[e.level] + '</span>' +
          (e.s.type === 'db' && !e.inf.d.verified ? '<span class="tag-unv">仿單待核對</span>' : '') + '</div>';
        if (e.s.type === 'custom') html += '資料庫未收錄，請依健保署仿單自行確認。';
        else if (!e.findings.length) html += '無特別提醒。';
        else html += '<ul>' + e.findings.map(function (f) { return '<li>' + esc(f.clinician) + '</li>'; }).join('') + '</ul>';
        if (e.s.type === 'db') {
          var d = e.inf.d;
          html += '<details class="talk"><summary>口頭衛教重點</summary><ul>' +
            '<li><b>怎麼吃：</b>' + esc(d.howTo) + '</li><li><b>要注意：</b>' + d.warnings.map(esc).join('；') + '</li>' +
            '<li><b>可能的不舒服：</b>' + d.sideEffects.map(esc).join('；') + '</li><li><b>馬上就醫：</b>' + d.seekHelp.map(esc).join('；') + '</li></ul></details>';
        }
        html += '</div>';
      });
    }
    $('alerts').innerHTML = html;
    var n = evals.filter(function (e) { return e.level === 'adjust' || e.level === 'avoid'; }).length + inter.length;
    $('alertCount').textContent = n || '';
  }

  /* ================= 小卡 ================= */
  function renderSheet(r, evals, ctx) {
    var T = S();
    var d = new Date();
    var dateStr = lang === 'zh' ? (d.getFullYear() - 1911) + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日'
      : d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var name = r.surname ? T.honFmt.replace('{s}', r.surname).replace('{h}', T.hon[honKey(r)]) : '';
    var title = name ? T.title.replace('{n}', name) : T.titleAnon;
    var org = $('org').value.trim();

    var top = '<div class="c-head"><h1>' + esc(title) + '</h1><div class="c-meta">' + (org ? esc(org) + '<br>' : '') + dateStr + '</div></div>';
    if (!evals.length) top += '<div class="c-empty">請在左側加入藥物</div>';
    else {
      var rows = CARD.SLOTS.concat(['none']).map(function (k) {
        var list = evals.filter(function (e) { return k === 'none' ? !e.s.slots.length : e.s.slots.indexOf(k) !== -1; });
        if (!list.length) return '';
        return '<div class="c-row"><div class="c-badge">' + Icons.slot(k) + '<span>' + esc(k === 'none' ? T.asDirected : T.slot[k]) + '</span></div><div class="c-lines">' +
          list.map(function (e) {
            var s = e.s;
            var line = CARD.LOOK_FMT[lang](s.color, s.shape, s.qty, s.unit, lang === 'zh' ? e.inf.title : e.inf.en);
            var ref = (s.color || s.shape) ? '<small>' + esc(e.inf.title + (e.inf.en && e.inf.en !== e.inf.title ? ' ' + e.inf.en : '')) + '</small>' : '';
            return '<div class="c-line">' + Icons.pill(s.color, s.shape) + '<span><b>' + esc(line) + '</b>' + (lang === 'zh' ? '：' : ': ') + esc(T.purpose[s.purpose]) + ref + '</span></div>';
          }).join('') + '</div></div>';
      }).join('');
      top += '<div class="c-table">' + rows + '</div>';
    }

    var bot = '';
    CARD.TOPICS.forEach(function (t) {
      var a = topicAuto(t, ctx);
      if (!itemState(t.id, a.suggested)) return;
      var text = t.id in edited ? edited[t.id] : sentence(a.keys, lang, ctx);
      if (text.trim()) bot += '<div class="c-row c-tip"><div class="c-badge sm">' + Icons.icon(t.badge) + '<span>' + esc(T.badge[t.badge]) + '</span></div><div class="c-text">' + esc(text) + '</div></div>';
    });
    var alerts = CARD.ALERTS.filter(function (al) { return itemState(al.id, ctx.alertSug.indexOf(al.id) !== -1); }).map(function (al) {
      return al.id in edited ? edited[al.id] : T.text[al.text];
    }).filter(function (x) { return x.trim(); });
    if (alerts.length) bot += '<div class="c-alerts">' + alerts.map(function (a) { return '<div class="c-alert">' + Icons.icon('alert') + '<span><b>' + esc(T.badge.alert) + (lang === 'zh' ? '：' : ': ') + '</b>' + esc(a) + '</span></div>'; }).join('') + '</div>';
    var phone = $('phone').value.trim();
    bot += '<div class="c-foot">' + esc(T.pharmacy) + (phone ? ' · ' + esc(phone) : '') + '</div>';

    $('sheet').className = 'sheet lang-' + lang;
    $('topInner').innerHTML = top;
    $('botInner').innerHTML = bot;
  }

  /* 兩區各自縮放字級：上方 2/3 放藥，下方 1/3 放提醒 */
  function fitZone(box, inner, from, to) {
    var cs = getComputedStyle(box);
    var avail = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    for (var size = from; size >= to; size -= 0.5) {
      inner.style.fontSize = size + 'px';
      if (inner.scrollHeight <= avail) return { size: size, fit: true };
    }
    return { size: to, fit: false };
  }
  function fitSheet() {
    var a = fitZone($('sheetTop'), $('topInner'), 26, 12);
    var b = fitZone($('sheetBottom'), $('botInner'), 20, 11);
    var info = $('fitInfo'), msg, warn = false;
    if (!a.fit) { msg = '⚠ 藥物太多，用藥時間表放不下一頁'; warn = true; }
    else if (!b.fit) { msg = '⚠ 下方提醒放不下：請少勾幾項或縮短句子'; warn = true; }
    else if (a.size < 15 || b.size < 13) { msg = '字偏小（藥物 ' + a.size + '・提醒 ' + b.size + '）：可少勾幾項提醒'; warn = true; }
    else msg = 'A4 一頁 · 藥物字級 ' + a.size + ' · 提醒字級 ' + b.size;
    info.textContent = msg;
    info.classList.toggle('warn', warn);
  }

  /* ================= 主更新 ================= */
  function update(opts) {
    opts = opts || {};
    var r = readPatient();
    syncHonorific(r);
    renderRenal(r);
    var evals = evaluateAll(r);
    var inter = Beers.interactions(evals.filter(function (e) { return e.key; }).map(function (e) { return { key: e.key, name: e.inf.title }; }), r);
    var ctx = context(r, evals, inter);
    if (!opts.keepLeft) { renderSelected(evals); renderPickers(ctx); }
    renderLangChips();
    renderAlerts(r, evals, inter);
    renderSheet(r, evals, ctx);
    fitSheet();
  }

  /* ================= 事件 ================= */
  ['surname', 'age', 'scr', 'weight', 'egfrIn', 'crclIn', 'scrDirect', 'weightDirect', 'dialysis', 'org', 'phone'].forEach(function (id) {
    $(id).addEventListener('input', function () { update(); });
    $(id).addEventListener('change', function () { update(); });
  });
  document.querySelectorAll('input[name=sex], input[name=mode]').forEach(function (el) {
    el.addEventListener('change', function () {
      var direct = radio('mode') === 'direct';
      $('calcFields').classList.toggle('hidden', direct);
      $('directFields').classList.toggle('hidden', !direct);
      update();
    });
  });
  document.querySelectorAll('input[name=hon]').forEach(function (el) {
    el.addEventListener('change', function () { honTouched = true; update(); });
  });

  function renderSuggest() {
    var list = search($('drugSearch').value), ul = $('suggest');
    if (!list.length) { ul.classList.add('hidden'); ul.innerHTML = ''; return; }
    activeIdx = Math.max(0, Math.min(activeIdx, list.length - 1));
    ul.innerHTML = list.map(function (it, i) {
      return '<li data-i="' + i + '" class="' + (i === activeIdx ? 'active' : '') + '"><span class="gen">' + esc(it.gen) + '</span><span>' + esc(it.label) + '</span><span class="cat">' + esc(it.cat) + '</span></li>';
    }).join('');
    ul.classList.remove('hidden');
  }
  function addFromSearch(ref) {
    addRef(ref);
    $('drugSearch').value = '';
    activeIdx = 0;
    renderSuggest();
    update();
    $('drugSearch').focus();
  }
  $('drugSearch').addEventListener('input', function () { activeIdx = 0; renderSuggest(); });
  $('drugSearch').addEventListener('keydown', function (ev) {
    var list = search(this.value);
    if (ev.key === 'ArrowDown') { activeIdx++; renderSuggest(); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp') { activeIdx--; renderSuggest(); ev.preventDefault(); }
    else if (ev.key === 'Enter') {
      ev.preventDefault();
      if (list.length) addFromSearch(list[Math.max(0, Math.min(activeIdx, list.length - 1))].ref);
      else if (this.value.trim()) addFromSearch({ type: 'custom', name: this.value.trim() });
    } else if (ev.key === 'Escape') $('suggest').classList.add('hidden');
  });
  $('suggest').addEventListener('mousedown', function (ev) {
    var li = ev.target.closest('li');
    if (!li) return;
    ev.preventDefault();
    addFromSearch(search($('drugSearch').value)[+li.dataset.i].ref);
  });
  $('drugSearch').addEventListener('blur', function () { setTimeout(function () { $('suggest').classList.add('hidden'); }, 120); });

  $('bulkAdd').addEventListener('click', function () {
    var names = $('bulkText').value.split(/[\n,，、;；]+/).map(function (x) { return x.trim(); }).filter(Boolean);
    var added = 0, unknown = [];
    names.forEach(function (n) {
      var ref = resolve(n);
      if (ref.type === 'custom') unknown.push(n);
      if (addRef(ref)) added++;
    });
    $('bulkMsg').textContent = '已加入 ' + added + ' 種' + (unknown.length ? '；未收錄：' + unknown.join('、') : '');
    $('bulkText').value = '';
    update();
  });

  $('selected').addEventListener('click', function (ev) {
    var rm = ev.target.closest('[data-rm]');
    if (rm) { selected.splice(+rm.dataset.rm, 1); update(); return; }
    var sl = ev.target.closest('[data-slot]');
    if (sl) {
      var s = selected[+sl.dataset.i], k = sl.dataset.slot, at = s.slots.indexOf(k);
      if (at === -1) s.slots.push(k); else s.slots.splice(at, 1);
      s.slots.sort(function (a, b) { return CARD.SLOTS.indexOf(a) - CARD.SLOTS.indexOf(b); });
      update();
    }
  });
  $('selected').addEventListener('change', function (ev) {
    var f = ev.target.dataset.f;
    if (!f) return;
    var s = selected[+ev.target.dataset.i];
    s[f] = f === 'qty' ? parseFloat(ev.target.value) : ev.target.value;
    update();
  });

  function pickHandler(ev) {
    var id = ev.target.dataset.pick;
    if (id) { pick[id] = ev.target.checked; ev.target.parentNode.classList.toggle('off', !ev.target.checked); update({ keepLeft: true }); }
  }
  function editHandler(ev) {
    var id = ev.target.dataset.edit;
    if (!id) return;
    edited[id] = ev.target.value;
    update({ keepLeft: true });
  }
  ['topicList', 'alertList'].forEach(function (id) {
    $(id).addEventListener('change', pickHandler);
    $(id).addEventListener('input', editHandler);
  });
  $('langChips').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-lang]');
    if (b) { lang = b.dataset.lang; update({ keepLeft: true }); }
  });

  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('active', x === t); });
      $('sheetPane').classList.toggle('hidden', t.dataset.tab !== 'sheetPane');
      $('alertPane').classList.toggle('hidden', t.dataset.tab !== 'alertPane');
    });
  });
  if ($('print')) $('print').addEventListener('click', function () { window.print(); });

  $('reset').addEventListener('click', function () {
    document.querySelectorAll('#surname, #age, #scr, #weight, #egfrIn, #crclIn, #scrDirect, #weightDirect, #org, #phone').forEach(function (el) { el.value = ''; });
    $('dialysis').checked = false;
    document.querySelector('input[name=sex][value=M]').checked = true;
    selected = []; pick = {}; edited = {}; lang = 'zh'; honTouched = false;
    $('bulkMsg').textContent = '';
    update();
  });

  $('demo').addEventListener('click', function () {
    $('reset').click();
    $('surname').value = '林';
    document.querySelector('input[name=sex][value=F]').checked = true;
    $('age').value = 82;
    $('renalBox').open = true;
    $('scr').value = 1.3; $('weight').value = 52;
    var demo = [
      ['脈優', { color: 'white', shape: 'round', slots: ['ab'] }],
      ['metformin', { color: 'white', shape: 'oblong', slots: ['ab', 'ad'] }],
      ['佳糖維', { color: 'pink', shape: 'round', slots: ['ab'] }],
      ['艾必克凝', { color: 'yellow', shape: 'oval', slots: ['ab', 'ad'] }],
      ['蓋舒泰', { color: 'white', shape: 'round', slots: ['ad'] }],
      ['Stilnox', { color: 'white', shape: 'oblong', slots: ['hs'] }],
      ['普拿疼', { color: 'white', shape: 'oblong', slots: ['prn'] }]
    ];
    demo.forEach(function (x) {
      addRef(resolve(x[0]));
      Object.assign(selected[selected.length - 1], x[1]);
    });
    update();
  });

  update();
})();
