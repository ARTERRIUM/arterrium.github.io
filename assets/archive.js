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
          close: 'Close', theme: 'Theme', all: 'All themes', allOps: 'All operations', more: 'Show more', showing: function (n, m) { return n + ' of ' + m; },
          ins: { works: 'works', visitorLed: 'follow a visitor\'s vote', artistLed: 'are the artists\' own idea',
                 lead: 'Who leads the change', retention: 'How much of the parent survives', retentionNote: 'Share of the parent\'s motifs a child keeps. Lower means a bigger change.',
                 lineages: 'Lineages', lineagesNote: 'Every family starts from one genesis. The bar is its size; the number is how deep it has grown.',
                 hands: 'Four hands', handsNote: 'Motifs each artist uses far more than the others, found in the archive\'s own tags.',
                 chosen: 'chosen by visitors', visitors: 'Visitors who shaped the work', visitorsNote: 'Wins, and the longest a proposal had to be repeated before it won.',
                 attempts: 'attempts', bridges: 'Memory bridges', bridgesNote: 'Times a work cites an earlier work in its sources.',
                 crossLineage: 'cross a lineage', crossTheme: 'cross a theme', reach: 'Re-evolution reaches back',
                 reachNote: 'generations on average, from the frontier to the old parent it returns to', hubs: 'Most returned-to works',
                 hubsNote: 'Parents with the most children.', children: 'children', flow: 'Motif flow', flowNote: 'Recurring motifs in order of first appearance, and the generations they reach. Purple squares mark a motif that crossed into a second theme.',
                 timeline: 'Works per generation', timelineNote: 'How each theme fills out generation by generation.' } },
    ko: { pieces: '작품', gen: '세대', from: '←', continuedBy: '이어진 작품', statement: '작가 노트',
          proposal: '현장 세션의 제안', memory: '기억 출처', model: '모델', open: '열기',
          empty: '아직 아카이브에 작품이 없습니다.', failed: '아카이브를 불러오지 못했습니다.',
          tree: '진화 트리', click: '점을 누르면 작품이 열립니다', archive: '아카이브', live: '실시간',
          museum: '상설전', show: '기획전', book: '도록', pieceCount: function (n) { return n + '점'; },
          ops: { genesis: '제네시스', branch: '분기', mutation: '변이', 're-evolution': '재진화' },
          close: '닫기', theme: '테마', all: '전체 테마', allOps: '모든 방식', more: '더 보기', showing: function (n, m) { return m + '점 중 ' + n + '점'; },
          ins: { works: '점', visitorLed: '점은 방문객의 투표를 따랐고', artistLed: '점은 아티스트 자신의 선택이었습니다',
                 lead: '변화를 이끄는 쪽', retention: '부모에게서 얼마나 남는가', retentionNote: '자식 작품이 부모의 모티프를 유지한 비율입니다. 낮을수록 큰 변화입니다.',
                 lineages: '계보', lineagesNote: '모든 가족은 하나의 제네시스에서 시작합니다. 막대는 크기, 숫자는 세대 깊이입니다.',
                 hands: '네 개의 손', handsNote: '각 아티스트가 다른 이들보다 훨씬 자주 쓰는 모티프를 아카이브의 태그에서 찾았습니다.',
                 chosen: '회 방문객에게 선택됨', visitors: '작품을 바꾼 방문객들', visitorsNote: '채택된 횟수와, 채택되기까지 같은 제안을 반복한 최장 횟수입니다.',
                 attempts: '회 시도', bridges: '기억의 다리', bridgesNote: '작품이 출처에서 이전 작품을 인용한 횟수입니다.',
                 crossLineage: '건은 다른 계보를', crossTheme: '건은 다른 테마를 넘었습니다', reach: '재진화가 거슬러 오르는 거리',
                 reachNote: '세대 (평균). 가장 앞선 세대에서 되돌아간 옛 부모까지의 거리입니다', hubs: '가장 자주 되돌아간 작품',
                 hubsNote: '자식이 가장 많은 부모 작품입니다.', children: '자식', flow: '모티프의 흐름', flowNote: '세 번 이상 등장한 모티프를 첫 등장 순으로, 도달한 세대와 함께 보여줍니다. 보라색 칸은 두 번째 테마로 건너간 모티프입니다.',
                 timeline: '세대별 작품 수', timelineNote: '각 테마가 세대를 거치며 어떻게 채워졌는지 보여줍니다.' } }
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
    if (head) head.innerHTML = '<span><b>' + esc(T.archive) + '</b> · ' + esc(themes.join(' · ')) + '</span><span class="pulse"><i></i>' + esc(T.live) + '</span>';
    function show(theme) {
      var sub = theme ? list.filter(function (p) { return p.theme === theme; }) : list;
      renderTree(svg, sub);
      if (foot) foot.innerHTML = '<span>' + esc(T.tree) + (theme ? ' · ' + esc(theme) : '') + '</span><span>' + esc(T.pieceCount(sub.length)) + ' · ' + esc(T.click) + '</span>';
      var branches = 0, muts = 0, gens = 0;
      sub.forEach(function (p) { if (p.operation === 'branch' || p.operation === 're-evolution') branches++; if (p.operation === 'mutation') muts++; gens = Math.max(gens, p.generation); });
      var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
      set('s-branch', branches); set('s-mut', muts); set('s-gen', gens);
    }
    if (themes.length > 1) {
      var chips = document.createElement('div'); chips.className = 'theme-chips';
      chips.innerHTML = '<button class="on" data-theme="">' + esc(T.all) + '</button>' + themes.map(function (t) { return '<button data-theme="' + esc(t) + '">' + esc(t) + '</button>'; }).join('');
      svg.insertAdjacentElement('afterend', chips);
      chips.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        chips.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
        show(b.getAttribute('data-theme') || null);
      });
    }
    show(null);
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
  var PAGE = 24;
  function wireGrid(list) {
    var grid = document.getElementById('pieces-grid'); if (!grid) return;
    if (!list.length) { grid.innerHTML = '<p class="dim">' + esc(T.empty) + '</p>'; return; }
    var themes = []; list.forEach(function (p) { if (p.theme && themes.indexOf(p.theme) < 0) themes.push(p.theme); });
    var ops = ['genesis', 'branch', 'mutation', 're-evolution'];
    var state = { theme: null, op: null, shown: PAGE };
    // toolbar: theme chips, operation chips, count
    var tools = document.createElement('div'); tools.className = 'grid-tools';
    tools.innerHTML = (themes.length > 1 ? '<div class="theme-chips" data-k="theme"><button class="on" data-v="">' + esc(T.all) + '</button>' + themes.map(function (t) { return '<button data-v="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="theme-chips" data-k="op"><button class="on" data-v="">' + esc(T.allOps) + '</button>' + ops.map(function (o) { return '<button data-v="' + o + '">' + esc(T.ops[o] || o) + '</button>'; }).join('') + '</div>' +
      '<span class="grid-count"></span>';
    grid.insertAdjacentElement('beforebegin', tools);
    var more = document.createElement('div'); more.className = 'more-row'; more.innerHTML = '<button class="btn ghost"></button>';
    grid.insertAdjacentElement('afterend', more);
    function render() {
      var sub = list.filter(function (p) { return (!state.theme || p.theme === state.theme) && (!state.op || p.operation === state.op); });
      sub.sort(function (a, b) { return (b.generation - a.generation) || (b.id > a.id ? 1 : -1); });
      var page = sub.slice(0, state.shown);
      grid.innerHTML = page.length ? page.map(card).join('') : '<p class="dim">' + esc(T.empty) + '</p>';
      grid.querySelectorAll('.piece-card').forEach(function (el) {
        el.addEventListener('click', function () { openPiece(el.getAttribute('data-id')); });
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPiece(el.getAttribute('data-id')); } });
      });
      tools.querySelector('.grid-count').textContent = T.showing(page.length, sub.length);
      var btn = more.querySelector('button');
      if (sub.length > page.length) { more.hidden = false; btn.textContent = T.more + ' (' + Math.min(PAGE, sub.length - page.length) + ')'; } else { more.hidden = true; }
    }
    tools.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var group = b.parentNode; group.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      state[group.getAttribute('data-k')] = b.getAttribute('data-v') || null; state.shown = PAGE; render();
    });
    more.querySelector('button').addEventListener('click', function () { state.shown += PAGE; render(); });
    render();
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


  /* ---------- insights from data/ontology.json ---------- */
  function bar(label, value, max, cls, shown) {
    var w = max ? Math.max(2, Math.round(value / max * 100)) : 0;
    return '<div class="bar"><span class="lbl" title="' + esc(label) + '">' + esc(label) + '</span><span class="trk"><i class="' + (cls || '') + '" style="width:' + w + '%"></i></span><span class="val">' + esc(shown == null ? value : shown) + '</span></div>';
  }
  function wireInsights(o) {
    var host = document.getElementById('insights-grid'); if (!host || !o || !o.analysis) return;
    var I = T.ins, A = o.analysis, E = o.entities, out = [];
    // lineages
    var maxL = Math.max.apply(null, E.lineages.map(function (l) { return l.size; }));
    out.push('<div class="ins"><div class="eyebrow">' + esc(I.lineages) + '</div><p class="note">' + esc(I.lineagesNote) + '</p><div class="bars">' +
      E.lineages.slice().sort(function (a, b) { return b.size - a.size; }).map(function (l) { return bar(l.title, l.size, maxL, l.theme === E.themes[0].name ? '' : 'memory', l.size + ' · ' + l.depth); }).join('') + '</div></div>');
    // retention by operation
    var r = A.motif_retention_by_operation, ops = ['branch', 'mutation', 're-evolution'];
    out.push('<div class="ins"><div class="eyebrow">' + esc(I.retention) + '</div><p class="note">' + esc(I.retentionNote) + '</p><div class="bars">' +
      ops.map(function (k) { return bar(T.ops[k] || k, r[k] || 0, 0.5, k === 'mutation' ? 'mutation' : (k === 're-evolution' ? 'memory' : ''), Math.round((r[k] || 0) * 100) + '%'); }).join('') + '</div>' +
      '<div class="big" style="margin-top:16px">' + esc(A.re_evolution_reach_avg_generations) + '<small>' + esc(I.reach) + '</small></div><p class="note">' + esc(I.reachNote) + '</p></div>');
    // visitor-led vs artist-led
    var led = A.visitor_led_vs_artist_led, ledHtml = '';
    Object.keys(led).forEach(function (th) {
      var d = led[th], tot = d.visitor_led + d.artist_led;
      ledHtml += '<p class="note"><b style="color:var(--canvas);font-weight:500">' + esc(th) + '</b> · ' + d.visitor_led + ' ' + esc(I.visitorLed) + ', ' + d.artist_led + ' ' + esc(I.artistLed) + '</p>' +
        '<div class="bars">' + bar(T.ops.branch, d.visitor_led, tot) + bar(T.ops.mutation + ' + ' + T.ops['re-evolution'], d.artist_led, tot, 'mutation') + '</div>';
    });
    var b = A.memory_bridges;
    out.push('<div class="ins"><div class="eyebrow">' + esc(I.lead) + '</div>' + ledHtml +
      '<div class="eyebrow" style="margin-top:18px">' + esc(I.bridges) + '</div><div class="big">' + esc(b.total) + '</div><p class="note">' + esc(I.bridgesNote) + ' ' + esc(b.cross_lineage) + ' ' + esc(I.crossLineage) + ', ' + esc(b.cross_theme) + ' ' + esc(I.crossTheme) + '</p></div>');
    // hands
    out.push('<div class="ins"><div class="eyebrow">' + esc(I.hands) + '</div><p class="note">' + esc(I.handsNote) + '</p><div class="hands">' +
      A.artist_hands.map(function (h) {
        return '<div class="hand"><b>' + esc(h.artist) + '</b><div class="tags">' + h.signature_motifs.map(function (t) { return '<span class="sig">' + esc(t) + '</span>'; }).join('') +
          h.top_motifs.filter(function (t) { return h.signature_motifs.indexOf(t) < 0; }).slice(0, 3).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') +
          '<small>' + esc(h.pieces) + ' ' + esc(I.works) + ' · ' + esc(h.chosen_for_branch) + ' ' + esc(I.chosen) + '</small></div></div>';
      }).join('') + '</div></div>');
    // visitors
    var maxV = Math.max.apply(null, A.visitors.map(function (v) { return v.wins; }));
    out.push('<div class="ins"><div class="eyebrow">' + esc(I.visitors) + '</div><p class="note">' + esc(I.visitorsNote) + '</p><div class="bars">' +
      A.visitors.map(function (v) { return bar(v.name, v.wins, maxV, 'memory', v.wins + ' · ' + v.max_attempt + ' ' + esc(I.attempts)); }).join('') + '</div></div>');
    // hubs
    var maxH = A.most_returned_to[0] ? A.most_returned_to[0].children : 1;
    out.push('<div class="ins"><div class="eyebrow">' + esc(I.hubs) + '</div><p class="note">' + esc(I.hubsNote) + '</p><div class="bars">' +
      A.most_returned_to.map(function (h) { return bar(h.title, h.children, maxH, 'canvas', h.children + ' ' + esc(I.children)); }).join('') + '</div></div>');
    // timeline
    var tl = A.generation_timeline, tlHtml = '';
    Object.keys(tl).forEach(function (th, idx) {
      var arr = tl[th], mx = Math.max.apply(null, arr);
      tlHtml += '<p class="note" style="margin-top:' + (idx ? 14 : 0) + 'px"><b style="color:var(--canvas);font-weight:500">' + esc(th) + '</b></p><div class="timeline-bars">' +
        arr.map(function (n) { return '<i class="' + (idx ? 'lt' : '') + '" data-n="' + n + '" style="height:' + Math.max(4, Math.round(n / mx * 100)) + '%"></i>'; }).join('') + '</div>' +
        '<div class="timeline-lbl">' + arr.map(function (_, g) { return '<span>' + T.gen + ' ' + g + '</span>'; }).join('') + '</div>';
    });
    out.push('<div class="ins"><div class="eyebrow">' + esc(I.timeline) + '</div><p class="note">' + esc(I.timelineNote) + '</p>' + tlHtml + '</div>');
    // motif flow
    var maxG = 0; A.motif_flow.forEach(function (f) { f.generations.forEach(function (g) { maxG = Math.max(maxG, g); }); });
    out.push('<div class="ins wide"><div class="eyebrow">' + esc(I.flow) + '</div><p class="note">' + esc(I.flowNote) + '</p><div class="flow">' +
      A.motif_flow.slice(0, 28).map(function (f) {
        var cells = ''; for (var g = 0; g <= maxG; g++) cells += '<i class="' + (f.generations.indexOf(g) >= 0 ? 'on' + (f.themes > 1 ? ' x' : '') : '') + '" title="' + T.gen + ' ' + g + '"></i>';
        return '<div class="row"><span class="lbl">' + esc(f.motif) + '</span><span class="gens">' + cells + '</span><span class="val">' + esc(f.count) + ' · ' + esc(f.lead_artist) + '</span></div>';
      }).join('') + '</div></div>');
    host.innerHTML = out.join('');
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
    getJSON(ROOT + 'data/ontology.json').then(wireInsights).catch(function () {});
    return getJSON(ROOT + 'curations/index.json').then(wireCurations).catch(function () { wireCurations({ curations: [] }); });
  }).catch(function () { fail(T.failed); });
})();
