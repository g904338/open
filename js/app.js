/* global DRUG_DB, Renal */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var LEVEL_TEXT = { ok: '無需調整', caution: '注意', adjust: '需調整劑量', avoid: '不建議/禁用', unknown: '未收錄' };
  var selected = []; // [{ id } | { custom: '名稱' }]
  var activeIdx = -1;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : null; }
  function drugById(id) { return DRUG_DB.find(function (d) { return d.id === id; }); }
  function brandText(d) { return d.brands.map(function (b) { return b.zh + ' ' + b.en; }).join('、'); }
  function displayName(d) {
    var b = d.brands[0];
    return b ? b.zh + '（' + b.en + '）' : d.zh;
  }

  /* ---------- 讀取輸入 ---------- */
  function readPatient() {
    var mode = document.querySelector('input[name=mode]:checked').value;
    var input = {
      age: num('age'), sex: $('sex').value, weight: num('weight'),
      scr: mode === 'calc' ? num('scr') : num('scrDirect'),
      mode: mode, egfr: num('egfrIn'), crcl: num('crclIn'),
      dialysis: $('dialysis').checked
    };
    var r = Renal.assessRenal(input);
    r.name = $('name').value.trim();
    return r;
  }

  /* ---------- 腎功能顯示 ---------- */
  function renderRenal(r) {
    var parts = [];
    if (r.egfr != null) parts.push('eGFR <b>' + r.egfr.toFixed(1) + '</b> mL/min/1.73m²（' + r.source.egfr + '）');
    if (r.crcl != null) parts.push('CrCl <b>' + r.crcl.toFixed(1) + '</b> mL/min（' + r.source.crcl + '）');
    if (r.stage) parts.push('分期：<b>' + r.stage.code + '</b> ' + r.stage.label);
    var miss = [];
    if (document.querySelector('input[name=mode]:checked').value === 'calc') {
      if (r.age == null) miss.push('年齡');
      if (r.scr == null) miss.push('肌酸酐');
      if (r.weight == null && r.scr != null) miss.push('體重（CrCl 需要）');
    }
    if (miss.length) parts.push('<span class="muted">尚缺：' + miss.join('、') + '</span>');
    $('renalResult').innerHTML = parts.join('<br>');
  }

  /* ---------- 藥物搜尋 ---------- */
  function search(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    return DRUG_DB.filter(function (d) {
      var hay = [d.generic, d.zh, d.category].concat(d.brands.map(function (b) { return b.en + ' ' + b.zh; })).concat(d.nhiCode || []).join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    }).slice(0, 8);
  }
  function renderSuggest() {
    var list = search($('drugSearch').value);
    var ul = $('suggest');
    if (!list.length) { ul.classList.add('hidden'); ul.innerHTML = ''; activeIdx = -1; return; }
    if (activeIdx >= list.length) activeIdx = list.length - 1;
    ul.innerHTML = list.map(function (d, i) {
      return '<li data-id="' + d.id + '" class="' + (i === activeIdx ? 'active' : '') + '"><b>' + esc(d.generic) + '</b> ' + esc(brandText(d)) + '<span class="cat">' + esc(d.category) + '</span></li>';
    }).join('');
    ul.classList.remove('hidden');
  }
  function addDrug(item) {
    var dup = selected.some(function (s) { return (item.id && s.id === item.id) || (item.custom && s.custom === item.custom); });
    if (!dup) selected.push(item);
    $('drugSearch').value = '';
    activeIdx = -1;
    renderSuggest();
    update();
  }

  /* ---------- 主更新 ---------- */
  function evaluateAll(r) {
    return selected.map(function (s) {
      if (s.custom) return { custom: s.custom, level: 'unknown', findings: [] };
      var d = drugById(s.id);
      var ev = Renal.evaluateDrug(d, r);
      return { drug: d, level: ev.level, findings: ev.findings };
    });
  }

  function renderSelected(evals) {
    $('selected').innerHTML = evals.map(function (e, i) {
      var name = e.custom ? esc(e.custom) + '（自訂）' : '<b>' + esc(e.drug.generic) + '</b> ' + esc(displayName(e.drug));
      return '<li class="lv-' + e.level + '"><span>' + name + '<span class="tag lv-' + e.level + '">' + LEVEL_TEXT[e.level] + '</span></span><button data-i="' + i + '" title="移除" aria-label="移除">×</button></li>';
    }).join('');
  }

  function renderAlerts(r, evals) {
    if (!evals.length) { $('alerts').innerHTML = '<p class="muted">尚未加入藥物。</p>'; return; }
    var html = '';
    if (!r.hasRenal) html += '<p class="muted">尚未提供腎功能，以下未做腎功能劑量判斷。</p>';
    evals.forEach(function (e) {
      if (e.custom) {
        html += '<div class="alert lv-unknown"><b>' + esc(e.custom) + '<span class="tag lv-unknown">未收錄</span></b>資料庫無此藥，請藥師依健保署仿單自行確認腎功能及老年人劑量。</div>';
        return;
      }
      var d = e.drug;
      html += '<div class="alert lv-' + e.level + '"><b>' + esc(d.generic) + ' ' + esc(displayName(d)) + '<span class="tag lv-' + e.level + '">' + LEVEL_TEXT[e.level] + '</span>' +
        (d.verified ? '' : '<span class="tag unverified">仿單待核對</span>') + '</b>';
      if (e.findings.length) html += '<ul>' + e.findings.map(function (f) { return '<li>' + esc(f.clinician) + '</li>'; }).join('') + '</ul>';
      else html += '無特別提醒。';
      html += '</div>';
    });
    $('alerts').innerHTML = html;
  }

  function renderSheet(r, evals) {
    var inner = $('sheetInner');
    var today = new Date();
    var dateStr = today.getFullYear() - 1911 + ' 年 ' + (today.getMonth() + 1) + ' 月 ' + today.getDate() + ' 日';
    var org = $('org').value.trim();
    var phone = $('phone').value.trim();

    var html = '<div class="sh-head"><h1>我的用藥衛教單</h1><div class="org">' + (org ? esc(org) + '<br>' : '') + '日期：' + dateStr + '</div></div>';

    // 病人資料
    var kidney = '未提供';
    if (r.dialysis) kidney = '目前接受透析治療';
    else if (r.stage) {
      var vals = [];
      if (r.egfr != null) vals.push('eGFR ' + Math.round(r.egfr));
      if (r.crcl != null) vals.push('CrCl ' + Math.round(r.crcl));
      kidney = r.stage.plain + '（' + vals.join('，') + '）';
    }
    html += '<div class="sh-pt">' +
      '<span><b>姓名</b>' + (r.name ? esc(r.name) : '＿＿＿＿＿＿') + '</span>' +
      '<span><b>年齡</b>' + (r.age != null ? r.age + ' 歲' : '—') + '</span>' +
      '<span><b>性別</b>' + (r.sex === 'F' ? '女' : '男') + '</span>' +
      '<span><b>體重</b>' + (r.weight != null ? r.weight + ' kg' : '—') + '</span>' +
      '<span class="kidney"><b>腎功能</b>' + kidney + '</span></div>';

    if (!evals.length) {
      inner.innerHTML = html + '<div class="sh-empty">請在左側加入藥物</div>';
      return;
    }

    // 重點提醒
    var flagged = evals.filter(function (e) { return e.level === 'adjust' || e.level === 'avoid'; });
    if (flagged.length) {
      html += '<div class="sh-warn"><b>⚠ 特別提醒：</b>依您的' + (r.hasRenal ? '腎功能' : '') + (r.hasRenal && r.age >= 65 ? '與' : '') + (r.age >= 65 ? '年齡' : '') +
        '，下列藥物的劑量需要特別注意：<b>' + flagged.map(function (e) { return esc(e.drug.brands[0] ? e.drug.brands[0].zh : e.drug.zh); }).join('、') +
        '</b>。請依醫師處方服用，不要自行增減藥量；若有疑問請詢問藥師。</div>';
    }

    // 藥品卡
    html += '<div class="sh-drugs' + (evals.length === 1 ? ' one' : '') + '">';
    evals.forEach(function (e) {
      if (e.custom) {
        html += '<div class="drug"><h3>' + esc(e.custom) + '</h3><div class="row">此藥的衛教內容請由藥師補充說明：</div><div class="row">＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿</div><div class="row">＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿</div></div>';
        return;
      }
      var d = e.drug;
      var mine = e.findings.map(function (f) { return f.patient; }).filter(Boolean);
      mine = mine.filter(function (m, i) { return mine.indexOf(m) === i; });
      html += '<div class="drug lv-' + e.level + '">' +
        '<h3>' + esc(displayName(d)) + ' <small>' + esc(d.generic) + ' ' + esc(d.strength) + '</small></h3>' +
        '<div class="row"><span class="k">用途：</span>' + esc(d.use) + '</div>' +
        '<div class="row"><span class="k">用法：</span>' + esc(d.howTo) + '</div>' +
        (mine.length ? '<div class="me">★ 給您的提醒：' + mine.map(esc).join(' ') + '</div>' : '') +
        '<div class="row"><span class="k">注意：</span>' + d.warnings.map(esc).join('；') + '</div>' +
        '<div class="row"><span class="k">可能副作用：</span>' + d.sideEffects.map(esc).join('；') + '</div>' +
        '<div class="row danger"><span class="k danger">立即就醫：</span>' + d.seekHelp.map(esc).join('；') + '</div>' +
        (d.verified ? '' : '<div class="unv">（本藥資料待藥師依健保署仿單核對）</div>') +
        '</div>';
    });
    html += '</div>';

    // 一般叮嚀
    var tips = [];
    var renalImpaired = r.dialysis || (r.stage && ['G3a', 'G3b', 'G4', 'G5'].indexOf(r.stage.code) !== -1);
    if (renalImpaired) {
      tips.push('不要自行購買止痛藥（如布洛芬等消炎止痛藥）、中草藥或偏方，以免傷腎');
      tips.push('到其他科別看診或藥局買藥時，主動告知「我的腎功能不好」');
      tips.push('依醫師安排定期抽血、驗尿，追蹤腎功能');
    }
    if (r.age >= 65) {
      tips.push('起床、起身時動作放慢，預防頭暈跌倒');
      tips.push('可使用藥盒分裝，避免漏吃或重複吃');
    }
    tips.push('看診時請攜帶所有藥袋（含保健食品），讓醫師藥師了解完整用藥');
    tips.push('忘記吃藥時不要一次吃兩倍劑量，請詢問藥師');
    tips.push('藥品存放於陰涼乾燥處，遠離兒童');
    html += '<div class="sh-tips"><h4>生活小叮嚀</h4><ul>' + tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';

    html += '<div class="sh-foot"><span>資料來源：衛生福利部中央健康保險署 藥品仿單。本衛教單僅供參考，實際劑量請依醫師處方。' + (phone ? '<br>用藥諮詢：' + esc(phone) : '') + '</span><span>衛教藥師：＿＿＿＿＿＿</span></div>';

    inner.innerHTML = html;
  }

  /* 自動縮小字級，確保一頁 */
  function fitOnePage() {
    var sheet = $('sheet'), inner = $('sheetInner');
    var cs = getComputedStyle(sheet);
    var avail = sheet.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var size = 12.5;
    inner.style.fontSize = size + 'px';
    while (inner.scrollHeight > avail && size > 8) {
      size -= 0.25;
      inner.style.fontSize = size + 'px';
    }
    var over = inner.scrollHeight > avail;
    $('fitInfo').innerHTML = over
      ? '<span style="color:var(--avoid)">⚠ 內容超過一頁，請減少藥品數量或分開列印。</span>'
      : '一頁 A4 · 字級 ' + size.toFixed(2) + 'px';
  }

  function update() {
    var r = readPatient();
    renderRenal(r);
    var evals = evaluateAll(r);
    renderSelected(evals);
    renderAlerts(r, evals);
    renderSheet(r, evals);
    fitOnePage();
  }

  /* ---------- 事件 ---------- */
  ['name', 'age', 'sex', 'weight', 'scr', 'egfrIn', 'crclIn', 'scrDirect', 'dialysis', 'org', 'phone'].forEach(function (id) {
    $(id).addEventListener('input', update);
    $(id).addEventListener('change', update);
  });
  document.querySelectorAll('input[name=mode]').forEach(function (el) {
    el.addEventListener('change', function () {
      var direct = el.value === 'direct' && el.checked;
      $('calcFields').classList.toggle('hidden', direct);
      $('directFields').classList.toggle('hidden', !direct);
      update();
    });
  });

  $('drugSearch').addEventListener('input', function () { activeIdx = 0; renderSuggest(); });
  $('drugSearch').addEventListener('keydown', function (ev) {
    var list = search($('drugSearch').value);
    if (ev.key === 'ArrowDown') { activeIdx = Math.min(activeIdx + 1, list.length - 1); renderSuggest(); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp') { activeIdx = Math.max(activeIdx - 1, 0); renderSuggest(); ev.preventDefault(); }
    else if (ev.key === 'Enter') {
      ev.preventDefault();
      if (list.length && activeIdx >= 0) addDrug({ id: list[activeIdx].id });
      else if ($('drugSearch').value.trim()) addDrug({ custom: $('drugSearch').value.trim() });
    } else if (ev.key === 'Escape') { $('suggest').classList.add('hidden'); }
  });
  $('suggest').addEventListener('mousedown', function (ev) {
    var li = ev.target.closest('li');
    if (li) { ev.preventDefault(); addDrug({ id: li.dataset.id }); }
  });
  $('drugSearch').addEventListener('blur', function () { setTimeout(function () { $('suggest').classList.add('hidden'); }, 100); });
  $('selected').addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (b) { selected.splice(+b.dataset.i, 1); update(); }
  });
  $('print').addEventListener('click', function () { window.print(); });
  $('demo').addEventListener('click', function () {
    $('name').value = '王○明'; $('age').value = 82; $('sex').value = 'M'; $('weight').value = 58;
    document.querySelector('input[name=mode][value=calc]').checked = true;
    document.querySelector('input[name=mode][value=calc]').dispatchEvent(new Event('change'));
    $('scr').value = 1.6; $('dialysis').checked = false;
    selected = [{ id: 'metformin' }, { id: 'sitagliptin' }, { id: 'apixaban' }, { id: 'gabapentin' }, { id: 'amlodipine' }, { id: 'famotidine' }];
    update();
  });

  update();
})();
