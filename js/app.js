/* global DRUG_DB, Renal, Beers, TIPS, TIP_CATS, TIP_GROUPS */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var LEVEL_TEXT = { ok: '無特別提醒', caution: '注意', adjust: '需調整', avoid: '避免使用', unknown: '未收錄' };
  var RANK = { unknown: -1, ok: 0, caution: 1, adjust: 2, avoid: 3 };

  var selected = [];       // { type: 'db', id } | { type: 'lex', key } | { type: 'custom', name }
  var tipOverride = {};    // 藥師手動勾選結果 id -> boolean
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
  function lex(key) { return Beers.data.LEXICON[key]; }
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
  function radio(name) { return document.querySelector('input[name=' + name + ']:checked').value; }

  /* ================= 藥品資訊整合 ================= */
  function keyOf(s) {
    if (s.type === 'db') return dbById(s.id).generic.toLowerCase();
    if (s.type === 'lex') return s.key;
    return null;
  }
  function info(s) {
    if (s.type === 'db') {
      var d = dbById(s.id), b = d.brands[0];
      return { title: b ? b.zh : d.zh, en: b ? b.en : '', generic: d.generic, sub: d.generic + ' ' + d.strength, cat: d.category, d: d, short: b ? b.zh : d.zh };
    }
    if (s.type === 'lex') {
      var e = lex(s.key), parts = (e.brand || '').split(' ');
      var gen = s.key.replace(/(^|[\s-])\w/g, function (m) { return m.toUpperCase(); });
      return { title: e.brand ? parts[0] : e.zh, en: e.brand ? parts.slice(1).join(' ') : '', generic: gen, sub: gen + (e.brand ? '（' + e.zh + '）' : ''), cat: e.use, lexEntry: e, short: e.brand ? parts[0] : e.zh };
    }
    return { title: s.name, en: '', generic: '', sub: '資料庫未收錄', cat: '', short: s.name };
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
    Object.keys(Beers.data.LEXICON).forEach(function (k) {
      if (dbKeys.indexOf(k) !== -1) return;
      var e = Beers.data.LEXICON[k];
      if (list.some(function (x) { return x.ref.key && Beers.data.LEXICON[x.ref.key] === e; })) return; // 同義字只列一次
      var bparts = (e.brand || '').split(' ');
      list.push({
        ref: { type: 'lex', key: k }, gen: k, label: (e.brand ? e.brand + '・' : '') + e.zh, cat: e.use,
        hay: [k, e.zh, e.brand, e.use].join(' ').toLowerCase(),
        names: [k, e.zh].concat(bparts).map(norm)
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

  function sameRef(a, b) {
    return a.type === b.type && (a.id === b.id) && (a.key === b.key) && (a.name === b.name);
  }
  function addRef(ref) {
    if (selected.some(function (s) { return sameRef(s, ref); })) return false;
    selected.push(ref);
    return true;
  }

  /* ================= 讀取輸入 ================= */
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

  /* ================= 評估 ================= */
  function evaluateAll(r) {
    return selected.map(function (s) {
      var inf = info(s), findings = [];
      if (s.type === 'db') findings = Renal.evaluateDrug(inf.d, r).findings;
      var key = keyOf(s);
      if (key) {
        var hasRenalTip = findings.some(function (f) { return f.kind === 'renal' && f.patient; });
        findings = findings.concat(Beers.evaluate(key, r).map(function (f) {
          // 仿單已有腎功能衛教時，Beers 表 6 只留給藥師看，避免衛教單重複
          return hasRenalTip && f.table === 6 ? Object.assign({}, f, { patient: '' }) : f;
        }));
      }
      var level = s.type === 'custom' ? 'unknown' : findings.reduce(function (m, f) { return RANK[f.level] > RANK[m] ? f.level : m; }, 'ok');
      return { s: s, inf: inf, key: key, findings: findings, level: level };
    });
  }

  /* ================= 衛教項目 ================= */
  function tipContext(r, evals) {
    var groups = {};
    evals.forEach(function (e) {
      if (!e.key) return;
      var tags = Beers.tagsOf(e.key);
      Object.keys(TIP_GROUPS).forEach(function (g) {
        var G = TIP_GROUPS[g];
        if (G.keys.indexOf(e.key) !== -1 || G.tags.some(function (t) { return tags.indexOf(t) !== -1; })) groups[g] = true;
      });
    });
    return { elderly: r.age >= 65, renal: isRenalImpaired(r), count: evals.length, groups: groups };
  }
  function suggested(tip, ctx) {
    var w = tip.when;
    if (!w) return false;
    if (w.always) return true;
    if (w.elderly && ctx.elderly) return true;
    if (w.renal && ctx.renal) return true;
    if (w.manyDrugs && ctx.count >= w.manyDrugs) return true;
    if (w.groups && w.groups.some(function (g) { return ctx.groups[g]; })) return true;
    return false;
  }
  function renderTips(ctx) {
    var html = '';
    TIP_CATS.forEach(function (cat) {
      var items = TIPS.filter(function (t) { return t.cat === cat; });
      html += '<div class="tip-cat"><h3>' + cat + '</h3>';
      items.forEach(function (t) {
        var sug = suggested(t, ctx);
        var on = t.id in tipOverride ? tipOverride[t.id] : sug;
        html += '<label class="tip"><input type="checkbox" data-tip="' + t.id + '"' + (on ? ' checked' : '') + '><span>' + esc(t.text) + '</span>' + (sug ? '<span class="sugg">建議</span>' : '') + '</label>';
      });
      html += '</div>';
    });
    $('tipList').innerHTML = html;
  }
  function chosenTips(ctx) {
    var out = {};
    TIPS.forEach(function (t) {
      var on = t.id in tipOverride ? tipOverride[t.id] : suggested(t, ctx);
      if (on) (out[t.cat] = out[t.cat] || []).push(t.text);
    });
    var custom = $('customTips').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    if (custom.length) out['其他'] = custom;
    return out;
  }

  /* ================= 腎功能 ================= */
  function isRenalImpaired(r) {
    return r.dialysis || !!(r.stage && ['G3a', 'G3b', 'G4', 'G5'].indexOf(r.stage.code) !== -1);
  }
  function kidneyPlain(r) {
    if (r.dialysis) return '目前在洗腎';
    var v = r.egfr != null ? r.egfr : r.crcl;
    if (v == null) return null;
    var word = v >= 90 ? '正常' : v >= 60 ? '稍微變差' : v >= 45 ? '輕到中度變差' : v >= 30 ? '中度變差' : v >= 15 ? '很差' : '非常差';
    var pct = Math.max(1, Math.round(v / 10));
    return word + (v < 90 ? '（大約是正常人的 ' + pct + ' 成）' : '');
  }
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

  /* ================= 左側清單 ================= */
  function renderSelected(evals) {
    $('selected').innerHTML = evals.map(function (e, i) {
      return '<li><span class="nm"><b>' + esc(e.inf.title) + '</b> ' + esc(e.inf.en) + '<small>' + esc(e.inf.sub) + '</small></span>' +
        '<span class="lv lv-' + e.level + '">' + LEVEL_TEXT[e.level] + '</span>' +
        '<button data-i="' + i + '" title="移除" aria-label="移除">×</button></li>';
    }).join('');
    $('drugEmpty').classList.toggle('hidden', evals.length > 0);
    $('drugCount').textContent = evals.length ? '共 ' + evals.length + ' 種' : '';
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
      var sorted = evals.slice().sort(function (a, b) { return RANK[b.level] - RANK[a.level]; });
      html += '<h3 class="alert-sec">個別藥品</h3>';
      sorted.forEach(function (e) {
        html += '<div class="alert lv-' + e.level + '"><div class="t">' + esc(e.inf.title) + ' ' + esc(e.inf.en) + ' <small class="muted">' + esc(e.inf.generic) + '</small><span class="lv lv-' + e.level + '">' + LEVEL_TEXT[e.level] + '</span>' +
          (e.s.type === 'db' && !e.inf.d.verified ? '<span class="tag-unv">仿單待核對</span>' : '') + '</div>';
        if (e.s.type === 'custom') html += '資料庫未收錄，請依健保署仿單自行確認，並在衛教單上手寫補充。';
        else if (e.s.type === 'lex' && !e.findings.length) html += '此藥僅收錄於藥名字典，尚無仿單衛教資料；目前無 Beers 提醒。';
        else if (!e.findings.length) html += '無特別提醒。';
        else html += '<ul>' + e.findings.map(function (f) { return '<li>' + esc(f.clinician) + '</li>'; }).join('') + '</ul>';
        html += '</div>';
      });
    }
    $('alerts').innerHTML = html;
    var n = evals.filter(function (e) { return e.level === 'adjust' || e.level === 'avoid'; }).length + inter.length;
    $('alertCount').textContent = n || '';
  }

  /* ================= 衛教單 ================= */
  function renderSheet(r, evals, inter, tips) {
    var d = new Date();
    var dateStr = (d.getFullYear() - 1911) + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
    var org = $('org').value.trim(), phone = $('phone').value.trim();
    var who = r.surname ? esc(r.surname) + (r.sex === 'F' ? ' 女士' : ' 先生') : '＿＿＿＿';

    var h = '<div class="sh-head"><h1>我的用藥衛教單</h1><div class="org">' + (org ? esc(org) + '<br>' : '') + dateStr + '</div></div>';
    h += '<div class="sh-pt"><span><b>姓名</b>' + who + '</span><span><b>年齡</b>' + (r.age != null ? r.age + ' 歲' : '＿＿ 歲') + '</span>';
    var k = kidneyPlain(r);
    if (k) h += '<span class="kidney"><b>腎臟功能</b>' + k + '</span>';
    h += '</div>';

    if (!evals.length) { $('sheetInner').innerHTML = h + '<div class="sh-empty">請在左側加入藥物</div>'; return; }

    var flagged = evals.filter(function (e) { return e.level === 'adjust' || e.level === 'avoid'; });
    if (flagged.length) {
      h += '<div class="sh-warn"><b>★ 請特別注意：</b><b>' + uniq(flagged.map(function (e) { return e.inf.short; })).map(esc).join('、') +
        '</b>。請照藥袋上的量吃，<b>不要自己停藥或改變吃法</b>；下次看病時，請帶這張單子問醫師或藥師。</div>';
    }

    h += '<div class="sh-sec">我的藥（共 ' + evals.length + ' 種）</div><div class="sh-drugs">';
    evals.forEach(function (e) {
      var inf = e.inf, mine = uniq(e.findings.map(function (f) { return f.patient; }));
      var me = mine.length ? '<div class="me">★ 給您的提醒：' + mine.map(esc).join(' ') + '</div>' : '';
      h += '<div class="drug lv-' + e.level + '"><h3>' + esc(inf.title) + (inf.en ? ' <small>' + esc(inf.en) + '</small>' : '') + (inf.generic && inf.generic !== inf.en ? ' <small>' + esc(inf.generic) + '</small>' : '') + '</h3>';
      if (e.s.type === 'db') {
        var dd = inf.d;
        h += '<div class="r"><span class="k">這是什麼藥：</span>' + esc(dd.use) + '</div>' +
          '<div class="r"><span class="k">怎麼吃：</span>' + esc(dd.howTo) + '</div>' + me +
          '<div class="r' + (RANK[e.level] < 2 ? ' opt2' : '') + '"><span class="k">要注意：</span>' + dd.warnings.map(esc).join('；') + '</div>' +
          '<div class="r opt"><span class="k">可能的不舒服：</span>' + dd.sideEffects.map(esc).join('；') + '</div>' +
          '<div class="r danger"><span class="k">有這些情形請馬上就醫：</span>' + dd.seekHelp.map(esc).join('；') + '</div>';
      } else if (e.s.type === 'lex') {
        h += '<div class="r"><span class="k">這是什麼藥：</span>' + esc(inf.lexEntry.use) + '</div>' +
          '<div class="r"><span class="k">怎麼吃：</span>請照藥袋上的說明吃。</div>' + me +
          '<div class="r opt"><span class="k">其他說明：</span>＿＿＿＿＿＿＿＿＿＿＿＿＿＿</div>';
      } else {
        h += '<div class="r"><span class="k">這是什麼藥：</span>＿＿＿＿＿＿＿＿＿＿＿＿</div><div class="r"><span class="k">怎麼吃：</span>請照藥袋上的說明吃。</div><div class="r opt"><span class="k">要注意：</span>＿＿＿＿＿＿＿＿＿＿＿＿＿＿</div>';
      }
      h += '</div>';
    });
    h += '</div>';

    if (inter.length) {
      h += '<div class="sh-inter"><h4>這幾種藥一起吃，要特別小心</h4><ul>' + inter.map(function (x) {
        return '<li><b>' + uniq(x.names).map(esc).join(' ＋ ') + '：</b>' + esc(x.patient) + '</li>';
      }).join('') + '</ul></div>';
    }

    var cats = Object.keys(tips);
    if (cats.length) {
      h += '<div class="sh-tips"><div class="sh-sec">生活小叮嚀</div><div class="cols">' + cats.map(function (c) {
        return '<div class="grp"><b>' + esc(c) + '</b><ul>' + tips[c].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
      }).join('') + '</div></div>';
    }

    h += '<div class="sh-foot"><span>本單參考：健保署藥品仿單、美國老年醫學會老人用藥建議（2023）。實際用藥請依醫師處方。' + (phone ? '<br>用藥問題請洽：' + esc(phone) : '') + '</span><span>藥師：＿＿＿＿＿＿</span></div>';
    $('sheetInner').innerHTML = h;
  }

  /* 一頁 A4：先縮字，再改三欄，再省略次要欄位 */
  function fitOnePage(nDrugs) {
    var sheet = $('sheet'), inner = $('sheetInner');
    var cs = getComputedStyle(sheet);
    var avail = sheet.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var stages = nDrugs <= 1 ? [{ cols: 1, compact: false, from: 14, to: 9 }]
      : [{ cols: 2, compact: 0, from: 13, to: 10.5 }, { cols: 3, compact: 0, from: 11.5, to: 10 },
         { cols: 3, compact: 1, from: 11, to: 10 }, { cols: 3, compact: 2, from: 11, to: 8 }];
    var fit = false, st, size;
    for (var i = 0; i < stages.length && !fit; i++) {
      st = stages[i];
      sheet.style.setProperty('--cols', st.cols);
      sheet.classList.toggle('compact', st.compact >= 1);
      sheet.classList.toggle('compact2', st.compact >= 2);
      for (size = st.from; size >= st.to; size -= 0.25) {
        inner.style.fontSize = size + 'px';
        if (inner.scrollHeight <= avail) { fit = true; break; }
      }
    }
    var info = $('fitInfo');
    var small = fit && size < 10;
    info.classList.toggle('warn', !fit || small);
    info.textContent = small ? '⚠ 字有點小（' + size.toFixed(1) + '）：長輩不易閱讀，建議少勾幾項衛教項目' : fit
      ? 'A4 一頁 · ' + st.cols + ' 欄 · 字級 ' + size.toFixed(1) + (st.compact ? ' · 已精簡' + (st.compact > 1 ? '「可能的不舒服」及一般藥品的「要注意」' : '「可能的不舒服」') : '')
      : '⚠ 內容超過一頁：請減少勾選的衛教項目或藥品數';
  }

  /* ================= 主更新 ================= */
  function update() {
    var r = readPatient();
    renderRenal(r);
    var evals = evaluateAll(r);
    var inter = Beers.interactions(evals.filter(function (e) { return e.key; }).map(function (e) { return { key: e.key, name: e.inf.short }; }), r);
    var ctx = tipContext(r, evals);
    renderSelected(evals);
    renderTips(ctx);
    renderAlerts(r, evals, inter);
    renderSheet(r, evals, inter, chosenTips(ctx));
    fitOnePage(evals.length);
  }

  /* ================= 事件 ================= */
  document.querySelectorAll('input, textarea').forEach(function (el) {
    if (el.id === 'drugSearch' || el.id === 'bulkText' || el.dataset.tip) return;
    el.addEventListener('input', update);
    el.addEventListener('change', update);
  });
  document.querySelectorAll('input[name=mode]').forEach(function (el) {
    el.addEventListener('change', function () {
      var direct = radio('mode') === 'direct';
      $('calcFields').classList.toggle('hidden', direct);
      $('directFields').classList.toggle('hidden', !direct);
    });
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
    var b = ev.target.closest('button');
    if (b) { selected.splice(+b.dataset.i, 1); update(); }
  });
  $('tipList').addEventListener('change', function (ev) {
    var id = ev.target.dataset.tip;
    if (id) { tipOverride[id] = ev.target.checked; update(); }
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
    document.querySelectorAll('#surname, #age, #scr, #weight, #egfrIn, #crclIn, #scrDirect, #weightDirect, #customTips').forEach(function (el) { el.value = ''; });
    $('dialysis').checked = false;
    document.querySelector('input[name=sex][value=M]').checked = true;
    selected = []; tipOverride = {};
    $('bulkMsg').textContent = '';
    update();
  });

  $('demo').addEventListener('click', function () {
    $('reset').click();
    $('surname').value = '王';
    $('age').value = 82;
    $('renalBox').open = true;
    $('scr').value = 1.6; $('weight').value = 58;
    ['metformin', 'Januvia', '艾必克凝', 'gabapentin', '脈優', 'famotidine', 'Xanax', 'zolpidem', 'omeprazole'].forEach(function (n) { addRef(resolve(n)); });
    update();
  });

  update();
})();
