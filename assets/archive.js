/* ARTERRIUM archive: wires the static site to pieces/index.json and curations/index.json.
   Loaded with <script src="assets/archive.js" data-root="./" data-lang="en" defer>.
   If the JSON cannot be read (no pieces yet, file://), the page keeps its demo tree. */
(function () {
  var script = document.currentScript;
  var ROOT = (script && script.getAttribute('data-root')) || './';
  var LANG = (script && script.getAttribute('data-lang')) || 'en';
  var T = {
    en: { pieces: 'pieces', gen: 'gen', from: 'from', continuedBy: 'continued by', statement: 'Statement',
          proposal: 'Proposal from the session', memory: 'Memory sources', model: 'Model', open: 'Open',
          empty: 'No pieces in the archive yet.', failed: 'The archive could not be loaded.',
          tree: 'Evolution tree', click: 'click a node', archive: 'Archive', live: 'live',
          museum: 'Museum', show: 'Show', book: 'Book', pieceCount: function (n) { return n + ' pieces'; },
          ops: { genesis: 'genesis', branch: 'branch', mutation: 'mutation', 're-evolution': 're-evolution' },
          close: 'Close', theme: 'Theme' },
    ko: { pieces: '작품', gen: '세대', from: '←', continuedBy: '이어진 작품', statement: '작가 노트',
          proposal: '현장 세션의 제안', memory: '기억 출처', model: '모델', open: '열기',
          empty: '아직 아카이브에 작품이 없습니다.', failed: '아카이브를 불러오지 못했습니다.',
          tree: '진화 트리', click: '점을 누르면 작품이 열립니다', archive: '아카이브', live: '실시간',
          museum: '미술관', show: '기획전', book: '도록', pieceCount: function (n) { return n + '점'; },
          ops: { genesis: '제네시스', branch: '분기', mutation: '변이', 're-evolution': '재진화' },
          close: '닫기', theme: '테마' }
  }[LANG] || null;
  if (!T) T = {};
  var COLORS = { genesis: '#E9E7D7', branch: '#87BFA7', mutation: '#9D97CC', 're-evolution': '#D6C09B' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function getJSON(url) { return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }

  var pieces = [], byId = {}, children = {};

  /* ---------- lineage tree in the hero card ---------- */
  function layout(list) {
    var roots = list.filter(function (p) { return !p.parent_id || !byId[p.parent_id]; });
    var pos = {}, x = 0;
    function leaves(p) { var k = children[p.id] || []; return k.length ? k.reduce(function (a, c) { return a + leaves(c); }, 0) : 1; }
    function place(p, x0, w) {
      pos[p.id] = { x: x0 + w / 2, y: p.generation };
      var k = children[p.id] || [], cx = x0;
      k.forEach(function (c) { var lw = leaves(c); place(c, cx, lw); cx += lw; });
    }
    roots.forEach(function (r) { var lw = leaves(r); place(r, x, lw); x += lw + 0.6; });
    return { pos: pos, width: Math.max(1, x - 0.6), depth: Math.max.apply(null, list.map(function (p) { return p.generation; }).concat([0])) };
  }

  function renderTree(svg, list) {
    var L = layout(list), W = 800, H = 600, padX = 70, padTop = 60, padBot = 60;
    var sx = function (v) { return padX + (L.width <= 1 ? (W - 2 * padX) / 2 : (v - 0.5) / (L.width - 0) * (W - 2 * padX)); };
    var sy = function (g) { return L.depth === 0 ? H / 2 : H - padBot - g / L.depth * (H - padTop - padBot); };
    var out = ['<defs><filter id="glow"><feGaussianBlur stdDeviation="6"/></filter></defs>'];
    list.forEach(function (p) {
      if (!p.parent_id || !byId[p.parent_id]) return;
      var a = L.pos[p.parent_id], b = L.pos[p.id];
      out.push('<path d="M' + sx(a.x) + ' ' + sy(a.y) + ' C ' + sx(a.x) + ' ' + ((sy(a.y) + sy(b.y)) / 2) + ', ' + sx(b.x) + ' ' + ((sy(a.y) + sy(b.y)) / 2) + ', ' + sx(b.x) + ' ' + sy(b.y) +
        '" fill="none" stroke="' + COLORS[p.operation] + '" stroke-width="2" stroke-linecap="round" opacity=".85"' + (p.operation === 're-evolution' ? ' stroke-dasharray="4 6"' : '') + '/>');
    });
    list.forEach(function (p) {
      var q = L.pos[p.id], c = COLORS[p.operation] || '#fff', r = p.generation === 0 ? 10 : 8;
      out.push('<g class="node" data-id="' + esc(p.id) + '" tabindex="0" role="button" aria-label="' + esc(p.title) + '">' +
        (p.operation === 'mutation' ? '<circle cx="' + sx(q.x) + '" cy="' + sy(q.y) + '" r="' + (r * 2.4) + '" fill="rgba(157,151,204,.16)"/>' : '') +
        '<circle cx="' + sx(q.x) + '" cy="' + sy(q.y) + '" r="' + r + '" fill="' + c + '"/>' +
        (p.generation === 0 ? '<text x="' + sx(q.x) + '" y="' + (sy(q.y) + 26) + '" text-anchor="middle" font-size="11" fill="rgba(244,241,232,.72)">' + esc(p.title.length > 26 ? p.title.slice(0, 25) + '…' : p.title) + '</text>' : '') +  // later generations: tooltip + click only, so labels never overlap
        '<title>' + esc(p.title + ' — ' + p.artist + ' · ' + p.operation + ' · gen ' + p.generation) + '</title></g>');
    });
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = out.join('');
    svg.querySelectorAll('.node').forEach(function (n) {
      n.addEventListener('click', function () { openPiece(n.getAttribute('data-id')); });
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPiece(n.getAttribute('data-id')); } });
    });
  }

  function wireHero(list) {
    var canvas = document.getElementById('tree'), svg = document.getElementById('lineage');
    if (!svg) return;
    renderTree(svg, list);
    svg.removeAttribute('hidden'); if (canvas) canvas.setAttribute('hidden', '');  // SVG elements have no .hidden property
    var card = svg.closest('.live-card'); if (!card) return;
    var head = card.querySelector('.head'); var foot = card.querySelector('.foot');
    var themes = []; list.forEach(function (p) { if (p.theme && themes.indexOf(p.theme) < 0) themes.push(p.theme); });
    var theme = themes.join(' · ');
    if (head) head.innerHTML = '<span><b>' + esc(T.archive) + '</b>' + (theme ? ' · ' + esc(theme) : '') + '</span><span class="pulse"><i></i>' + esc(T.live) + '</span>';
    if (foot) foot.innerHTML = '<span>' + esc(T.tree) + '</span><span>' + esc(T.pieceCount(list.length)) + ' · ' + esc(T.click) + '</span>';
    var branches = 0, muts = 0, gens = 0;
    list.forEach(function (p) { if (p.operation === 'branch' || p.operation === 're-evolution') branches++; if (p.operation === 'mutation') muts++; gens = Math.max(gens, p.generation); });
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('s-branch', branches); set('s-mut', muts); set('s-gen', gens);
    window.__arterriumArchiveLoaded = true;
  }

  /* ---------- explore grid ---------- */
  function card(p) {
    return '<figure class="piece-card" data-id="' + esc(p.id) + '" tabindex="0" role="button">' +
      '<img src="' + ROOT + 'pieces/' + esc(p.svg) + '" alt="' + esc(p.title) + '" loading="lazy">' +
      '<figcaption><div class="op ' + esc(p.operation) + '">' + esc(T.ops[p.operation] || p.operation) + ' · ' + esc(T.gen) + ' ' + p.generation + ' · ' + esc(p.artist) + '</div>' +
      '<h3>' + esc(p.title) + '</h3><p>' + esc(p.statement || '') + '</p>' +
      (p.parent_id && byId[p.parent_id] ? '<div class="lineage-note">' + esc(T.from) + ' ' + esc(byId[p.parent_id].title) + '</div>' : '') +
      '</figcaption></figure>';
  }
  function wireGrid(list) {
    var grid = document.getElementById('pieces-grid'); if (!grid) return;
    if (!list.length) { grid.innerHTML = '<p class="dim">' + esc(T.empty) + '</p>'; return; }
    var sorted = list.slice().sort(function (a, b) { return (b.generation - a.generation) || (b.id > a.id ? 1 : -1); });
    grid.innerHTML = sorted.map(card).join('');
    grid.querySelectorAll('.piece-card').forEach(function (el) {
      el.addEventListener('click', function () { openPiece(el.getAttribute('data-id')); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPiece(el.getAttribute('data-id')); } });
    });
  }

  /* ---------- curations ---------- */
  function wireCurations(data) {
    var grid = document.getElementById('curations-grid'); if (!grid) return;
    var list = (data && data.curations) || [];
    if (!list.length) { grid.innerHTML = '<p class="dim">' + esc(T.empty) + '</p>'; return; }
    grid.innerHTML = list.map(function (c) {
      var cover = (c.piece_ids || []).slice(0, 3).map(function (id) { return byId[id]; }).filter(Boolean);
      return '<a class="cur-card" href="' + ROOT + 'curations/' + esc(c.page) + '">' +
        '<div class="cur-covers">' + cover.map(function (p) { return '<img src="' + ROOT + 'pieces/' + esc(p.svg) + '" alt="">'; }).join('') + '</div>' +
        '<div class="cur-body"><div class="eyebrow">' + esc(T[c.kind] || c.kind) + ' · ' + esc(T.pieceCount(c.pieces)) + '</div>' +
        '<h3>' + esc(c.title) + '</h3>' + (c.subtitle ? '<div class="cur-sub">' + esc(c.subtitle) + '</div>' : '') +
        '<p>' + esc(c.summary || '') + '</p><span class="cur-open">' + esc(T.open) + ' →</span></div></a>';
    }).join('');
  }

  /* ---------- piece dialog ---------- */
  var dlg;
  function ensureDialog() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog'); dlg.id = 'piece-dialog'; dlg.className = 'piece-dialog';
    dlg.innerHTML = '<button class="dlg-close" aria-label="' + esc(T.close) + '">×</button><div class="dlg-body"></div>';
    document.body.appendChild(dlg);
    dlg.querySelector('.dlg-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    return dlg;
  }
  function openPiece(id) {
    var p = byId[id]; if (!p) return;
    var d = ensureDialog(), body = d.querySelector('.dlg-body');
    var kids = children[id] || [];
    body.innerHTML = '<div class="dlg-art"><img src="' + ROOT + 'pieces/' + esc(p.svg) + '" alt="' + esc(p.title) + '"></div>' +
      '<div class="dlg-text"><div class="op ' + esc(p.operation) + '">' + esc(T.ops[p.operation] || p.operation) + ' · ' + esc(T.gen) + ' ' + p.generation + '</div>' +
      '<h3>' + esc(p.title) + '</h3><div class="dlg-meta">' + esc(p.artist) + ' · ' + esc(p.model || '') + '</div>' +
      '<div class="dlg-section"><div class="eyebrow">' + esc(T.statement) + '</div><p id="dlg-statement">' + esc(p.statement || '') + '</p></div>' +
      (p.proposal ? '<div class="dlg-section"><div class="eyebrow">' + esc(T.proposal) + '</div><blockquote>' + esc(p.proposal) + '</blockquote></div>' : '') +
      '<div class="dlg-section" id="dlg-memory"></div>' +
      '<div class="dlg-lineage">' +
      (p.parent_id && byId[p.parent_id] ? '<div>' + esc(T.from) + ' <a href="#" data-id="' + esc(p.parent_id) + '">' + esc(byId[p.parent_id].title) + '</a></div>' : '') +
      (kids.length ? '<div>' + esc(T.continuedBy) + ' ' + kids.map(function (k) { return '<a href="#" data-id="' + esc(k.id) + '">' + esc(k.title) + '</a>'; }).join(', ') + '</div>' : '') +
      '</div><div class="dlg-id">' + esc(p.id) + ' · <a href="' + ROOT + 'pieces/' + esc(p.id) + '/statement.md">statement.md</a></div></div>';
    body.querySelectorAll('a[data-id]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); openPiece(a.getAttribute('data-id')); }); });
    if (!d.open) d.showModal();
    // full statement + memory sources on demand
    getJSON(ROOT + 'pieces/' + p.id + '/piece.json').then(function (full) {
      var st = body.querySelector('#dlg-statement'); if (st && full.statement) st.textContent = full.statement;
      var mem = body.querySelector('#dlg-memory');
      if (mem && full.memory_sources && full.memory_sources.length) {
        mem.innerHTML = '<div class="eyebrow">' + esc(T.memory) + '</div><ul>' + full.memory_sources.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
      }
    }).catch(function () {});
  }

  /* ---------- boot ---------- */
  function fail(msg) {
    var grid = document.getElementById('pieces-grid'); if (grid) grid.innerHTML = '<p class="dim">' + esc(msg) + '</p>';
    var cg = document.getElementById('curations-grid'); if (cg) cg.innerHTML = '<p class="dim">' + esc(msg) + '</p>';
  }
  getJSON(ROOT + 'pieces/index.json').then(function (data) {
    pieces = (data && data.pieces) || [];
    pieces.forEach(function (p) { byId[p.id] = p; });
    pieces.forEach(function (p) { if (p.parent_id && byId[p.parent_id]) (children[p.parent_id] = children[p.parent_id] || []).push(p); });
    if (!pieces.length) { fail(T.empty); return; }
    wireHero(pieces); wireGrid(pieces);
    return getJSON(ROOT + 'curations/index.json').then(wireCurations).catch(function () { wireCurations({ curations: [] }); });
  }).catch(function () { fail(T.failed); });
})();
