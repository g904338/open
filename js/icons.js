/* 小卡圖示：線條圖示（跟著文字顏色）與藥丸外觀圖（依顏色、形狀繪製） */
(function (root) {
  'use strict';

  function svg(body, label) {
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
      (label ? ' role="img" aria-label="' + label + '"' : ' aria-hidden="true"') + '>' + body + '</svg>';
  }

  var P = {
    // 時段
    sunrise: '<path d="M3 19h18"/><path d="M7 19a5 5 0 0 1 10 0"/><path d="M12 8v3M5.6 12.6l1.6 1.6M18.4 12.6l-1.6 1.6M2.5 16h2M19.5 16h2"/><path d="M9.5 5.5 12 3l2.5 2.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/>',
    bed: '<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11.5" r="1.8"/><path d="M15 3.5h3l-3 3h3"/>',
    asneeded: '<path d="M4 4.5h16v11H10l-5 4v-4H4z"/><path d="M12 7.5v3.5M12 13.2v.01"/>',
    // 主題
    diet: '<path d="M3 12h18a9 8 0 0 1-18 0z"/><path d="M8 20h8"/><path d="M13.5 9.5 17 2.5M16.5 9.5 21 4"/>',
    fall: '<circle cx="10" cy="4" r="2"/><path d="M10 6.5v6.5l-3 8M10 13l2.5 3.5V21M10 8.5l-3.5 3M10 8.5l4.5 2.5"/><path d="M15.5 11.5V21"/>',
    exercise: '<circle cx="13.5" cy="4" r="2"/><path d="M10.5 21l2-6-2.5-3 2-5 2.5 3H18M10 7.5 7 11M12.5 15l3 6"/>',
    sleep: '<path d="M18.5 15.5A7.5 7.5 0 1 1 8.5 5.5a6 6 0 0 0 10 10z"/><path d="M15 3h4.5L15 8h4.5"/>',
    kidney: '<path d="M8.5 3.5C5 3.5 3 7.5 3 12s2 8.5 5.5 8.5c2 0 3-1.5 3-3.3 0-1.7-1.2-2.7-1.2-5.2s1.2-3.5 1.2-5.2c0-1.8-1-3.3-3-3.3z"/><path d="M15.5 3.5c3.5 0 5.5 4 5.5 8.5s-2 8.5-5.5 8.5c-2 0-3-1.5-3-3.3 0-1.7 1.2-2.7 1.2-5.2s-1.2-3.5-1.2-5.2c0-1.8 1-3.3 3-3.3z"/>',
    meds: '<rect x="2.5" y="7" width="19" height="13" rx="2"/><path d="M2.5 11.5h19M8.8 11.5V20M15.2 11.5V20M6 7V4.5h12V7"/>',
    measure: '<path d="M12 20.5s-8-4.7-8-10.6A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 8 2.7c0 5.9-8 10.6-8 10.6z"/><path d="M6.5 12.5h3l1.5-2.5 2 4.5 1.5-2H18"/>',
    recheck: '<rect x="4.5" y="4" width="15" height="17.5" rx="2"/><path d="M9 4V2.5h6V4"/><path d="M12 9v7M8.5 12.5h7"/>',
    alert: '<path d="M10.3 3.8 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4.5M12 17.3v.01"/>'
  };

  var SLOT_ICON = { bb: 'sunrise', ab: 'sunrise', bl: 'sun', al: 'sun', bd: 'moon', ad: 'moon', hs: 'bed', prn: 'asneeded', none: 'meds' };

  /* ---------- 藥丸外觀 ---------- */
  var FILL = {
    white: '#ffffff', yellow: '#f6d65a', pink: '#f4a7b9', orange: '#f39c4a', red: '#d9534f',
    blue: '#6fa8dc', green: '#7bc47f', brown: '#a0704a', purple: '#a98bd6', gray: '#b3b3b3'
  };
  var uid = 0;
  function pill(color, shape, label) {
    var f = color ? FILL[color] : '#eef1f0';
    var st = 'stroke="#4a4a4a" stroke-width="1.6"';
    var body;
    switch (shape) {
      case 'oblong': body = '<rect x="3" y="6" width="34" height="12" rx="6" fill="' + f + '" ' + st + '/><path d="M20 7.5v9" stroke="#4a4a4a" stroke-width="1" opacity=".45"/>'; break;
      case 'oval': body = '<ellipse cx="20" cy="12" rx="16" ry="9" fill="' + f + '" ' + st + '/>'; break;
      case 'capsule':
        var id = 'cap' + (++uid);
        body = '<clipPath id="' + id + '"><rect x="2" y="5" width="18" height="14"/></clipPath>' +
          '<rect x="2" y="5" width="36" height="14" rx="7" fill="#ffffff" ' + st + '/>' +
          '<rect x="2" y="5" width="36" height="14" rx="7" fill="' + f + '" clip-path="url(#' + id + ')"/>' +
          '<rect x="2" y="5" width="36" height="14" rx="7" fill="none" ' + st + '/><path d="M20 5v14" stroke="#4a4a4a" stroke-width="1.2"/>'; break;
      case 'triangle': body = '<path d="M20 2.5 34 21H6z" fill="' + f + '" ' + st + ' stroke-linejoin="round"/>'; break;
      case 'round': body = '<circle cx="20" cy="12" r="10" fill="' + f + '" ' + st + '/><path d="M14 12h12" stroke="#4a4a4a" stroke-width="1" opacity=".45"/>'; break;
      default:
        if (color) body = '<circle cx="20" cy="12" r="10" fill="' + f + '" ' + st + '/>';
        else body = '<rect x="3" y="6" width="34" height="12" rx="6" fill="' + f + '" stroke="#9aa5a2" stroke-width="1.4" stroke-dasharray="3 2"/>';
    }
    return '<svg class="pillsvg" viewBox="0 0 40 24"' + (label ? ' role="img" aria-label="' + label + '"' : ' aria-hidden="true"') + '>' + body + '</svg>';
  }

  var api = {
    icon: function (name, label) { return P[name] ? svg(P[name], label) : ''; },
    slot: function (k) { return svg(P[SLOT_ICON[k] || 'meds']); },
    pill: pill,
    names: Object.keys(P)
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Icons = api;
})(this);
