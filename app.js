/* Elkader Holiday Light Show — interactive map
   Pan/zoom over the campground map with a tappable marker on each of the
   60 display spots. Everything lives inside the viewport: the page itself
   never scrolls, because this runs in a fixed-height iframe. */
(function () {
  'use strict';

  var DATA = window.HLS;
  if (!DATA) return;

  var MAP_W = DATA.image.w, MAP_H = DATA.image.h;
  var MAX = 6;

  /* The page is 792 x 612, but the map stops well short of its edges: a
     blank strip 124 units deep down the right-hand side, and a strip along
     the bottom. Opened on the whole page, that blank was on
     screen as well -- the map sat left of centre with nothing between it and
     the list. So the view works on this box instead, in page units: the
     opening view fits ITS height, panning stops at ITS edges, and the page
     outside it is clipped away and never drawn. It reaches to x 0 because
     the High Street, the EXIT sign and the railway run off the left edge of
     the page and are meant to. The top is the page's own top: High Street
     runs off it there, and that is the way out, so none of it may be cut.
     The bottom sits just under the Pony Hollow Trail's name and the arrow
     down High Street -- as close as it goes without cutting either. */
  var CROP = { x: 0, y: 0, w: 668, h: 583 };
  function cropPx() {
    var k = MAP_W / DATA.page.w;
    return { x: CROP.x * k, y: CROP.y * k, w: CROP.w * k, h: CROP.h * k };
  }

  var hls     = document.getElementById('hls');
  var stage   = document.getElementById('stage');
  var canvas  = document.getElementById('canvas');
  var markers = document.getElementById('markers');
  var panel   = document.getElementById('panel');
  var listEl  = document.getElementById('list');
  var countEl = document.getElementById('count');
  var qEl     = document.getElementById('q');
  var card    = document.getElementById('card');
  var tabMap  = document.getElementById('tabMap');
  var tabList = document.getElementById('tabList');

  /* ---------- phone or wide ---------- */

  /* Below 660px the list cannot sit beside the map (remeasureList() stops
     crediting it a width there), so the page changes shape: a MAP / DISPLAYS
     bar across the foot, the list full screen over the map behind DISPLAYS,
     and the card a sheet rising from the bar. The same page and the same
     elements -- only where the card lives changes, below. */
  var PHONE = window.matchMedia ? window.matchMedia('(max-width: 660px)') : null;
  function isPhone() { return !!(PHONE && PHONE.matches); }

  /* On a wide screen the card is docked at the foot of the list, inside it.
     On a phone it is a sheet over the map while the list is put away, so it
     cannot be inside the list: it moves out to sit beside it in .hls, and
     the stylesheet places it from there (`.hls > .card`). Moved back when
     the window widens again. */
  function placeCard() {
    var phone = isPhone();
    hls.classList.toggle('phone', phone);
    if (phone && card.parentNode !== hls) hls.appendChild(card);
    else if (!phone && card.parentNode !== panel) panel.insertBefore(card, document.querySelector('.credit-foot'));
  }

  /* How much of the stage the open sheet covers, on a phone: the window the
     map is framed in is what is left above it, so a picked bulb is brought
     up into view rather than under the card. Measured when the card opens,
     closes or is pulled down, never on a drag frame. */
  var sheetH = 0;
  function sheetInset() {
    sheetH = (isPhone() && !card.hidden) ? card.offsetHeight : 0;
    hls.style.setProperty('--sheet-h', sheetH + 'px');
  }
  function bottomInset() { return isPhone() ? sheetH : 0; }

  /* Nothing outside the crop is ever drawn. */
  (function clipToCrop() {
    var c = cropPx();
    canvas.style.clipPath = 'inset(' + c.y + 'px ' + (MAP_W - c.x - c.w) + 'px ' +
                            (MAP_H - c.y - c.h) + 'px ' + c.x + 'px)';
  })();

  var view = { s: 1, x: 0, y: 0 };
  var fitScale = 1;
  var active = null;
  var mkEls = {};

  /* Older Safari treats `overflow: clip` as `hidden`, which leaves these as
     scroll containers the browser will scroll to reveal a focused marker --
     dragging the chrome sideways. Put them straight back. */
  [stage, document.getElementById('hls')].forEach(function (el) {
    if (!el) return;
    el.addEventListener('scroll', function () {
      if (el.scrollLeft || el.scrollTop) { el.scrollLeft = 0; el.scrollTop = 0; }
    });
  });

  /* Counted in participants, not bulbs: the eight businesses with two spots
     are one each, and the spots still to be settled are nobody yet. Taken
     from the data, because a number written into the page by hand went stale
     the moment somebody pulled out. */
  var PARTICIPANTS = (function () {
    var seen = {}, n = 0;
    (DATA.spots || []).forEach(function (sp) {
      if (sp.name && !seen[sp.name]) { seen[sp.name] = 1; n++; }
    });
    return n;
  })();

  /* Called displays, counted in participants: a business with two spots is
     one entry on the list and counts once. Ketaki's wording. */
  function tally(n) {
    return n + (n === 1 ? ' display' : ' displays');
  }

  /* ---------- transform ---------- */

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* `will-change: transform` is held only while the view is actually moving.
     Left on, it pins the layer's rasterisation: the artwork keeps whatever
     resolution it had when the gesture started, so zooming in leaves vector
     shapes looking soft until something else forces a repaint. Dropping the
     hint once things settle makes the browser redraw the artwork at the scale
     now on screen, which is the whole point of shipping vector. */
  var settle;
  function moving() {
    canvas.style.willChange = 'transform';
    clearTimeout(settle);
    settle = setTimeout(function () { canvas.style.willChange = 'auto'; }, 180);
  }

  /* The smallest a marker gets on screen, in CSS px: a fingertip. */
  var MK_MIN = 34;

  function apply() {
    canvas.style.transform =
      'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.s + ')';
    canvas.style.setProperty('--s', view.s);
    moving();
    /* Each marker is the size of its own bulb, so it grows with the map and
       the tap target is the bulb you see, at any zoom -- zoomed right in, a
       bulb is a hundred pixels across, and a fixed 34 px target drifting off
       its middle was landing taps on the neighbour. Zoomed out, where a bulb
       is smaller than a fingertip, the marker holds at MK_MIN instead. */
    var floor = MK_MIN / view.s;
    for (var n in mkEls) sizeMarker(mkEls[n], floor);
    if (hallEl) sizeMarker(hallEl, floor);
  }

  function sizeMarker(el, floor) {
    var w = Math.max(el._w || 0, floor), h = Math.max(el._h || 0, floor);
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.margin = (-h / 2) + 'px 0 0 ' + (-w / 2) + 'px';
  }

  /* The build stamp is for previews only.

     This is a denylist rather than a list of preview hosts on purpose. An
     allowlist fails silently the wrong way: guess a preview host wrong and the
     stamp quietly never appears, which defeats the only reason it exists. A
     denylist fails the harmless way instead -- a stamp somewhere it was not
     wanted, which is visible and takes a second to fix.

     Add the live domain here when the map goes on the GoDaddy site. */
  var LIVE_HOSTS = [];

  (function revealBuildStamp() {
    var el = document.getElementById('build');
    if (!el) return;
    var h = (location.hostname || '').toLowerCase();
    for (var i = 0; i < LIVE_HOSTS.length; i++) {
      var live = LIVE_HOSTS[i];
      if (h === live || h.slice(-(live.length + 1)) === '.' + live) return;
    }
    el.hidden = false;
  })();

  /* How much of the stage's right edge the open list covers.

     The list is an overlay, so the stage underneath it is still full width;
     left to itself the map centres under the list and loses its right-hand
     side behind it -- the sponsor credit and the spots along the top right.
     Everything that frames the map works off the width the list leaves.

     Nought on a phone, where the list covers almost the whole stage: there is
     nothing left to centre in, and squeezing the map into the sliver beside
     it would be worse than leaving it where it is. */
  var listW = 0;

  /* Measured when it opens, closes or the window changes, not on every read:
     constrain() runs on each frame of a drag, and asking an element for its
     width forces the browser to lay the page out again before it answers. */
  function remeasureList() {
    var open = panel.classList.contains('open');
    var w = open ? panel.getBoundingClientRect().width : 0;
    listW = (w && w < stage.clientWidth * 0.5) ? w : 0;
    /* The zoom buttons and the credit sit on the map, so they move with its
       edge rather than hiding behind the list. */
    hls.style.setProperty('--list-w', listW + 'px');
  }

  function listInset() { return listW; }

  function constrain() {
    var vw = stage.clientWidth - listInset(), vh = stage.clientHeight - bottomInset();
    var c = cropPx(), s = view.s;
    var w = c.w * s, h = c.h * s;                 // the cropped map, on screen
    var left = view.x + c.x * s, top = view.y + c.y * s;
    // if it is smaller than the stage, centre it; otherwise keep it covering
    left = w <= vw ? (vw - w) / 2 : clamp(left, vw - w, 0);
    top  = h <= vh ? (vh - h) / 2 : clamp(top, vh - h, 0);
    view.x = left - c.x * s;
    view.y = top - c.y * s;
  }

  function setScale(s, cx, cy) {
    s = clamp(s, minScale(), MAX);
    var k = s / view.s;
    view.x = cx - (cx - view.x) * k;
    view.y = cy - (cy - view.y) * k;
    view.s = s;
    constrain();
    apply();
  }

  function measure() {
    var vw = stage.clientWidth - listInset(), vh = stage.clientHeight;
    var c = cropPx();
    fitScale = Math.min(vw / c.w, vh / c.h);
    return { vw: vw, vh: vh };
  }

  function centreAt(s, m) {
    var c = cropPx();
    view.s = s;
    view.x = (m.vw - c.w * s) / 2 - c.x * s;
    view.y = (m.vh - c.h * s) / 2 - c.y * s;
    constrain();
    apply();
  }

  /* The map opens at OPEN of the height -- all of it -- and that is the
     floor as well as the opening view: there is no zooming out past it. Top
     edge at the top of the box, bottom edge at its foot (on a phone, on the
     MAP / DISPLAYS bar), no white above or below.

     The height is the one thing that never changes, whatever screen it is
     on: the map is always the same fraction of the box it sits in, so the
     GoDaddy embed decides its size. It stood at 0.8 for part of 28 Oct 2026
     -- Ketaki asked for the map 20% smaller, then for it to meet the top and
     bottom edges again -- so OPEN is still the one number to change.

     Wherever that leaves the map wider than the viewport -- a phone, or a
     short frame -- it runs off the sides and you pan across it. That is the
     right trade: shrinking the whole map to fit a narrow screen makes sixty
     business names unreadable, and reading them is the thing this page is
     for. */
  var OPEN = 1;

  function minScale() {
    return stage.clientHeight / cropPx().h * OPEN;
  }

  function home() {
    var m = measure();
    centreAt(minScale(), m);
  }

  function focusSpot(spot, zoom) {
    var vw = stage.clientWidth - listInset(), vh = stage.clientHeight - bottomInset();
    var s = clamp(zoom || Math.max(view.s, fitScale * 2.6), minScale(), MAX);
    view.s = s;
    view.x = vw / 2 - spot.x * MAP_W * s;
    view.y = vh / 2 - spot.y * MAP_H * s;
    constrain();
    canvas.style.transition = 'transform .32s cubic-bezier(.4,0,.2,1)';
    apply();
    setTimeout(function () { canvas.style.transition = ''; }, 340);
  }

  /* Website, Facebook and Instagram, each as its own icon. Drawn inline so
     they inherit the card's colour and stay sharp at any size. */
  var LINK_KINDS = [
    { key: 'web', label: 'Website', shapes: [
      { d: 'M10 1.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4Z' },
      { d: 'M10 1.8c2.2 2.1 3.4 5 3.4 8.2S12.2 16.1 10 18.2' },
      { d: 'M10 1.8C7.8 3.9 6.6 6.8 6.6 10s1.2 6.1 3.4 8.2' },
      { d: 'M2.4 7.4h15.2M2.4 12.6h15.2' }
    ] },
    { key: 'facebook', label: 'Facebook', shapes: [
      { d: 'M12.8 10.5h2.1l.3-2.6h-2.4V6.3c0-.8.2-1.3 1.3-1.3h1.2V2.6c-.2 0-.9-.1-1.8-.1-1.8 0-3.1 1.1-3.1 3.2v2.2H8.2v2.6h2.2V18h2.4v-7.5Z',
        fill: true }
    ] },
    /* Stroked, not filled: a filled rounded square swallows the lens and the
       dot and comes out a solid block. */
    { key: 'instagram', label: 'Instagram', shapes: [
      { d: 'M6.6 2.8h6.8a3.8 3.8 0 0 1 3.8 3.8v6.8a3.8 3.8 0 0 1-3.8 3.8H6.6a3.8 3.8 0 0 1-3.8-3.8V6.6a3.8 3.8 0 0 1 3.8-3.8Z' },
      { d: 'M10 7.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z' },
      { d: 'M14.25 5.2a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9Z', fill: true }
    ] }
  ];

  /* What to call each link of a kind out loud. One of a kind needs only the
     kind. Two do not: "Website" twice tells a screen reader nothing, and two
     identical icons tell a reader nothing either.

     Art in the Park gave two websites on different hosts, so the host sorts
     them out. Ridgeview gave two Facebook pages on the same host, where it
     does not, so those are numbered instead. */
  function linkLabels(kind, hrefs) {
    if (hrefs.length < 2) return hrefs.map(function () { return kind.label; });
    var hosts = hrefs.map(function (href) {
      try {
        return new URL(href).hostname.replace(/^www\./, '');
      } catch (e) {
        return href;                 /* an unparseable href keeps its text */
      }
    });
    var distinct = hosts.filter(function (h, i) {
      return hosts.indexOf(h) === i;
    }).length === hosts.length;
    return hrefs.map(function (href, i) {
      return kind.label + (distinct ? ' (' + hosts[i] + ')'
                                    : ' ' + (i + 1) + ' of ' + hrefs.length);
    });
  }

  function fillLinks(sp) {
    var box = document.getElementById('cardLinks');
    if (!box) return;
    box.textContent = '';
    var links = sp.links || {};
    var any = false;
    LINK_KINDS.forEach(function (kind) {
      /* A list per kind. A plain string is still accepted, so an older
         data.js does not come up blank. */
      var hrefs = links[kind.key];
      if (!hrefs) return;
      if (!Array.isArray(hrefs)) hrefs = [hrefs];
      hrefs = hrefs.filter(Boolean);
      var labels = linkLabels(kind, hrefs);
      hrefs.forEach(function (href, k) {
        any = true;
        var label = labels[k];
        var a = document.createElement('a');
        a.className = 'card-link';
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.title = label;
        a.setAttribute('aria-label', label + ' — ' + sp.name +
                       ' (opens in a new tab)');
        var svg = el('svg', { viewBox: '0 0 20 20', 'aria-hidden': 'true',
                              focusable: 'false' });
        kind.shapes.forEach(function (sh) {
          svg.appendChild(el('path', sh.fill ? {
            d: sh.d, fill: 'currentColor'
          } : {
            d: sh.d, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4',
            'stroke-linecap': 'round', 'stroke-linejoin': 'round'
          }));
        });
        a.appendChild(svg);
        box.appendChild(a);
      });
    });
    box.hidden = !any;
  }

  /* ---------- bulbs ---------- */

  /* The spot numbers are drawn as Christmas bulbs. The outline is traced from
     the artwork Ketaki drew on page 2 of the Canva file, in its own 439x624
     space, so it can be filled in any colour and stays vector-crisp. */
  /* The bulb outline, traced out of the artwork by clean_map.py as three
     separate regions in its own 439x624 space: the outer silhouette, the
     glass, and the cap. Filled in that order, the black silhouette shows
     through as the outline exactly where the artwork has it. */

  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* Every bulb's position, angle, size and colour is read out of the Canva
     file by build_data.py — all 60 are placed by hand there, with the cap
     turned towards the path. Nothing is computed here; this only redraws
     them as vector so they stay sharp. The numbers are not drawn here: they
     are ordinary text spans and come through the lettering layer upright,
     exactly where Canva puts them. */
  function drawBulbs(svg) {
    var art = DATA.bulbArt;
    if (!DATA.bulbs || !DATA.bulbs.length || !art) return;

    var defs = el('defs');
    defs.appendChild(el('path', { id: 'bulb-solid', d: art.solid }));
    defs.appendChild(el('path', { id: 'bulb-cap',   d: art.cap }));
    defs.appendChild(el('path', { id: 'bulb-glass', d: art.glass }));

    /* A pool of light for each bulb colour, to sit behind the lit one. Seven
       colours across sixty bulbs, so these are shared rather than made per
       bulb. A real gradient rather than a stack of blurred shadows: light
       spilling onto paper falls off smoothly, and a blur wide enough to cover
       this much ground goes grey and flat. */
    var halo = {};
    DATA.bulbs.forEach(function (b) {
      if (!b.c || halo[b.c]) return;
      var id = 'halo-' + Object.keys(halo).length;
      halo[b.c] = id;
      var grad = el('radialGradient', { id: id });
      grad.appendChild(el('stop', { offset: '0%',   'stop-color': b.c,
                                    'stop-opacity': '.62' }));
      grad.appendChild(el('stop', { offset: '38%',  'stop-color': b.c,
                                    'stop-opacity': '.34' }));
      grad.appendChild(el('stop', { offset: '100%', 'stop-color': b.c,
                                    'stop-opacity': '0' }));
      defs.appendChild(grad);
    });
    svg.appendChild(defs);

    var ax = art.w / 2, ay = art.h / 2;    // rotation anchor: the image centre
    var layer = el('g', { 'class': 'bulbs' });
    DATA.bulbs.forEach(function (b) {
      // b.sx/b.sy carry the sign, so a bulb flipped in Canva stays flipped
      var g = el('g', {
        transform: 'translate(' + b.x.toFixed(2) + ',' + b.y.toFixed(2) + ') ' +
                   'rotate(' + b.a + ') ' +
                   'scale(' + (b.sx * b.w / art.w).toFixed(5) + ',' +
                              (b.sy * b.h / art.h).toFixed(5) + ') ' +
                   'translate(' + (-ax) + ',' + (-ay) + ')'
      });
      g.appendChild(el('use', { href: '#bulb-solid', fill: '#000000' }));
      g.appendChild(el('use', { href: '#bulb-cap',   fill: '#868685' }));
      g.appendChild(el('use', { href: '#bulb-glass', fill: b.c }));
      /* Wrapped in an outer group so the lit state has a transform of its
         own to play with. The inner one is already carrying the placement,
         rotation and mirroring read out of Canva, and animating that would
         send the bulb off across the map. */
      var holder = el('g', { 'class': 'bulb' });
      /* The pool of light, behind the bulb and in the layer's own coordinates
         -- the bulb's transform belongs to the artwork inside it. */
      if (halo[b.c]) {
        holder.appendChild(el('circle', {
          'class': 'halo', cx: b.x, cy: b.y, r: (b.h * 1.15).toFixed(2),
          fill: 'url(#' + halo[b.c] + ')'
        }));
      }
      /* Which spot this bulb is, so picking a business off the list can light
         it up, and what colour to light it -- a bulb glows in its own colour
         rather than some shared highlight. */
      if (b.n && b.n.length) holder.setAttribute('data-spot', b.n.join(' '));
      holder.style.setProperty('--glow', b.c);
      holder.appendChild(g);
      layer.appendChild(holder);
    });
    svg.appendChild(layer);
  }


  /* The DISPLAYS button on the phone bar carries the map's own bulb, as a
     silhouette in the button's colour, rather than some other lightbulb. */
  (function drawTabBulb() {
    var slot = document.getElementById('tabBulb');
    var art = DATA.bulbArt;
    if (!slot || !art) return;
    var svg = el('svg', { viewBox: '0 0 ' + art.w + ' ' + art.h,
                          'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(el('path', { d: art.solid, fill: 'currentColor' }));
    slot.appendChild(svg);
  })();

  /* ---------- lettering ---------- */

  /* The map image carries no text at all — clean_map.py strips it out — so
     every label is drawn here from the coordinates the same script read out
     of the Canva file. Being vector, it stays crisp however far you zoom. */
  (function drawText() {
    var svg = document.getElementById('textlayer');
    if (!svg || !DATA.labels) return;
    drawBulbs(svg);
    var frag = document.createDocumentFragment();
    DATA.labels.forEach(function (l) {
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', l.x);
      t.setAttribute('y', l.y);
      t.setAttribute('font-size', l.s);
      t.setAttribute('fill', l.c);
      if (l.a) t.setAttribute('text-anchor', l.a);
      /* Letter-spaced lines carry the width Canva set them to. Holding the
         text to it reproduces the tracking without needing the font metrics
         the spacing was originally derived from. */
      if (l.w) {
        t.setAttribute('textLength', l.w);
        t.setAttribute('lengthAdjust', 'spacing');
      }
      if (l.r) t.setAttribute('transform', 'rotate(' + l.r + ' ' + l.x + ' ' + l.y + ')');
      /* Which name this line belongs to, for the lines of a name set over
         several; declutter() moves them as one. */
      if (l.g) t.setAttribute('data-g', l.g);
      t.textContent = l.t;
      frag.appendChild(t);
    });

    /* The spots nobody has taken yet say so on the map, and flash to catch
       the eye -- they are the ones Ketaki is trying to sell.

       The word goes exactly where that spot's business name sat, which
       build_data keeps when it drops the name: under the bulb for one,
       beside it for the other, both laid out by hand in Canva around their
       neighbours. An offset from the bulb would have to guess at that. */
    if (DATA.booking) {
      DATA.spots.forEach(function (sp) {
        if (!sp.free || !sp.tag) return;
        var t = document.createElementNS(NS, 'text');
        t.setAttribute('class', 'free-tag');
        t.setAttribute('x', sp.tag.x);
        t.setAttribute('y', sp.tag.y);
        t.setAttribute('font-size', sp.tag.s);
        t.textContent = 'AVAILABLE';
        frag.appendChild(t);
      });
    }
    svg.appendChild(frag);
  })();

  /* ---------- keeping the lettering off the bulbs ---------- */

  /* A few names sit on top of the bulb they belong to, or the one next door,
     and hide the number printed on it. They are eased off here, measured on
     the real text in the real font after the page has drawn it -- the only
     place the widths are actually known, since the build has no font metrics.

     What a name has to clear is the bulb's face, taken as the number printed
     on it with a little room around. Not the whole bulb: a bulb is a teardrop
     whose tip points at the name it belongs to, and not the halo either,
     which is three times the size of the bulb and only there to light up. Push
     names clear of those and the map comes apart; the tip is meant to touch
     the name, which is how Ketaki drew it.

     Nothing else pushes. Names are not spaced against each other -- she set
     them where they are, often deliberately close, and a solver let loose on
     the whole map rearranges a layout that was made by hand. Nor do the
     numbers move: a spot number belongs on its bulb.

     Every move is checked, and a block is only left where it was put if it
     ends up clearer than it started. A name wedged between two bulbs cannot
     be freed by moving it -- off one is onto the other -- so it stays where
     she had it rather than being made worse, and is named in the console
     instead. */
  var CROWD_GAP = 0.6;        // page units of daylight asked for
  var CROWD_SHIFT = 3.5;      // the furthest any one name may be moved
  var CROWD_PASSES = 6;
  var BULB_PAD = 2.6;         // how far past the number the bulb's face runs

  function declutter() {
    var svg = document.getElementById('textlayer');
    if (!svg) return [];
    var all = [].slice.call(svg.querySelectorAll('text'))
                .filter(function (t) { return t.textContent.trim(); });

    /* The bulb faces: the numbers, with room around them. getBBox() is in
       page units here -- the text layer is drawn in the page's own
       coordinates -- so it can be compared with the names directly. */
    var faces = all.filter(function (t) {
      return /^[0-9]+$/.test(t.textContent.trim());
    }).map(function (t) {
      var b = t.getBBox();
      return [b.x - BULB_PAD, b.y - BULB_PAD,
              b.x + b.width + BULB_PAD, b.y + b.height + BULB_PAD];
    });
    if (!faces.length) return [];

    var items = all.filter(function (t) {
      if (/^[0-9]+$/.test(t.textContent.trim())) return false;  // the numbers
      if (t.getAttribute('class') === 'free-tag') return false; // AVAILABLE
      if (t.hasAttribute('textLength')) return false;           // the credit
      if (t.hasAttribute('transform')) return false;            // rotated signs
      return true;
    }).map(function (t) {
      var b = t.getBBox();
      return { el: t, box: [b.x, b.y, b.x + b.width, b.y + b.height] };
    });

    /* A name set over several lines moves as one, or the lines come apart.
       Which lines are one name is the build's to say (the label's `g`): on
       the drawn map two neighbours' names sit as close as two lines of the
       same name, and grouping by position chained three businesses into one
       block that then had nowhere to go. */
    var blocks = [], byGroup = {};
    items.forEach(function (it) {
      var g = it.el.getAttribute('data-g');
      var b = g && byGroup[g];
      if (b) {
        b.parts.push(it);
        b.box = [Math.min(b.box[0], it.box[0]), Math.min(b.box[1], it.box[1]),
                 Math.max(b.box[2], it.box[2]), Math.max(b.box[3], it.box[3])];
        return;
      }
      b = { parts: [it], box: it.box.slice(), dx: 0, dy: 0 };
      if (g) byGroup[g] = b;
      blocks.push(b);
    });
    blocks.forEach(function (b) { b.home = b.box.slice(); });

    function over(a, b) {
      return Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) *
             Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
    }
    function score(box) {
      var t = 0;
      for (var i = 0; i < faces.length; i++) t += over(box, faces[i]);
      return t;
    }
    function shove(blk, mx, my) {
      var nx = blk.dx + mx * 0.5, ny = blk.dy + my * 0.5;
      var far = Math.sqrt(nx * nx + ny * ny);
      if (far > CROWD_SHIFT) { nx *= CROWD_SHIFT / far; ny *= CROWD_SHIFT / far; }
      blk.dx = nx; blk.dy = ny;
      blk.box = [blk.home[0] + nx, blk.home[1] + ny,
                 blk.home[2] + nx, blk.home[3] + ny];
    }

    blocks.forEach(function (blk) {
      blk.was = score(blk.home);
      if (!blk.was) return;                       // already clear, leave it
      for (var pass = 0; pass < CROWD_PASSES; pass++) {
        faces.forEach(function (f) {
          var ox = Math.min(blk.box[2], f[2]) - Math.max(blk.box[0], f[0]) + CROWD_GAP;
          var oy = Math.min(blk.box[3], f[3]) - Math.max(blk.box[1], f[1]) + CROWD_GAP;
          if (ox <= 0 || oy <= 0) return;
          if (ox < oy) {
            shove(blk, (blk.box[0] + blk.box[2]) / 2 < (f[0] + f[2]) / 2 ? -ox : ox, 0);
          } else {
            shove(blk, 0, (blk.box[1] + blk.box[3]) / 2 < (f[1] + f[3]) / 2 ? -oy : oy);
          }
        });
      }
      blk.now = score(blk.box);
    });

    var moved = 0, stuck = [];
    blocks.forEach(function (blk) {
      if (!blk.was) return;
      var text = blk.parts.map(function (p) { return p.el.textContent; }).join(' ');
      /* Only a move that gets the name properly clear is worth making. A
         nudge that trades most of an overlap for a little of one has moved
         the name off where Ketaki put it and still looks wrong, so it is
         undone and the name reported for placing by hand. */
      if (blk.now > 0.01) {
        stuck.push(text);
        return;
      }
      moved++;
      var t = 'translate(' + blk.dx.toFixed(2) + ' ' + blk.dy.toFixed(2) + ')';
      blk.parts.forEach(function (p) { p.el.setAttribute('transform', t); });
    });
    if (window.console && console.info) {
      console.info('map: ' + moved + ' name(s) eased off a bulb' +
        (stuck.length ? '; left as drawn, nowhere clear to go: ' + stuck.join(', ')
                      : ''));
    }
    return stuck;
  }

  /* ---------- markers ---------- */

  /* One marker per business. A business with two spaces has a single number
     label on the map reading "5 & 6", so it gets one marker covering both. */
  DATA.spots.forEach(function (sp, i) {
    var b = document.createElement('button');
    b.className = 'mk';
    /* Centred on the bulb itself, and as big as the bulb: the number sits
       near the bulb's middle but not on it, and at a high zoom the
       difference is a finger's width. (The bulbs are in page units, the
       markers in canvas px; the page is drawn at twice its size.) */
    var k = MAP_W / DATA.page.w;
    var bulb = (DATA.bulbs || []).filter(function (bb) {
      return bb.n && bb.n.indexOf(sp.nums[0]) >= 0;
    })[0];
    if (bulb) {
      b.style.left = (bulb.x * k) + 'px';
      b.style.top  = (bulb.y * k) + 'px';
      b._w = bulb.w * k * 1.25;
      b._h = bulb.h * k * 1.25;
    } else {
      b.style.left = (sp.x * MAP_W) + 'px';
      b.style.top  = (sp.y * MAP_H) + 'px';
    }
    b.setAttribute('aria-label', spotWord(sp) + ': ' + sp.name);
    if (sp.nums.length > 1) b.classList.add('mk-wide');   // two bulbs to cover

    /* Hovering a bulb warms it: the same pool of its own colour the chosen
       one gets, held low and still. The marker is an invisible hit area over
       the artwork and the bulb is drawn in another layer, so CSS alone
       cannot join them -- the class goes on by hand. */
    b.addEventListener('pointerenter', function () { warmBulb(sp, true); });
    b.addEventListener('pointerleave', function () { warmBulb(sp, false); });
    b.addEventListener('focus', function () { warmBulb(sp, true); });
    b.addEventListener('blur', function () { warmBulb(sp, false); });

    b.addEventListener('click', function (e) {
      e.stopPropagation();
      if (dragged) return;          // the pointer was panning, not tapping
      select(i, false);
    });
    markers.appendChild(b);
    mkEls[i] = b;
  });

  /* ---------- Floral Hall ---------- */

  /* The one building you can tap: hot chocolate is served there every
     Saturday, and the themed nights happen there, so the shelter house
     carries the special events. Its box is the shape's extent in the
     artwork, in page units -- the one under the FLORAL HALL label, which
     optimise_svg.py keeps blue for the same reason. */
  var FLORAL_HALL = { x: 222.6, y: 81.2, w: 64.3, h: 61.0 };
  var hallEl = null;
  (function hallMarker() {
    var k = MAP_W / DATA.page.w;
    var b = document.createElement('button');
    b.className = 'mk mk-hall';
    b.style.left = ((FLORAL_HALL.x + FLORAL_HALL.w / 2) * k) + 'px';
    b.style.top  = ((FLORAL_HALL.y + FLORAL_HALL.h / 2) * k) + 'px';
    b._w = FLORAL_HALL.w * k;
    b._h = FLORAL_HALL.h * k;
    b.setAttribute('aria-label', 'Floral Hall: the special events');
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      if (dragged) return;
      openEvents();
    });
    markers.appendChild(b);
    hallEl = b;
  })();

  /* Takes a spot or a participant row -- both carry `nums`, and a row with
     two of them is the one that needs the plural. */
  function spotWord(x) {
    /* "5 & 6", the way the map prints a pair, and short enough not to wrap
       the card's sub-line onto a third line on a phone. */
    return x.nums.length > 1
      ? 'Spots ' + x.nums.join(' & ')
      : 'Spot ' + x.nums[0];
  }

  /* ---------- detail card ---------- */

  /* What colour each spot's bulb is, so the list can echo it. The colours
     live on the bulbs and the numbers live on the spots; the two were tied
     together in build_data.py, which is what makes this join possible. */
  var bulbTint = {}, bulbColour = {};
  (DATA.bulbs || []).forEach(function (b) {
    if (!b.n || !b.c) return;
    var hex = b.c.replace('#', '');
    if (hex.length !== 6) return;
    var rgb = [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)]
                .map(function (h) { return parseInt(h, 16); });
    b.n.forEach(function (n) {
      bulbTint[n] = 'rgba(' + rgb.join(',') + ',';
      bulbColour[n] = b.c;
    });
  });

  /* A bulb colour laid over white. Used for the card, which takes a wash of
     the colour of the bulb it belongs to -- strong enough to tell one card
     from the next, weak enough that a logo and black text still sit on it
     cleanly. Mixed down to a solid rather than left transparent: the card
     floats over the map, and a see-through one picks up whatever it is
     covering. */
  /* A spot's number drawn as its own bulb, for the list and the card. Same
     three traced paths the map draws, filled the same way, so the number in
     the panel is the thing you are looking for on the map rather than a
     separate piece of styling that has to be kept in step with it. */
  var GLASS_MID_X = 219.5;     // the glass runs 15..424 across
  var GLASS_MID_Y = 368;       // and 95..609 down, read a shade above centre

  function bulbChip(label, colour) {
    var art = DATA.bulbArt;
    if (!art) return null;
    var svg = el('svg', {
      'class': 'chip-bulb', viewBox: '0 0 ' + art.w + ' ' + art.h,
      'aria-hidden': 'true', focusable: 'false'
    });
    svg.appendChild(el('path', { d: art.solid, fill: '#000000' }));
    svg.appendChild(el('path', { d: art.cap,   fill: '#868685' }));
    svg.appendChild(el('path', { d: art.glass, fill: colour || '#d5d5d5' }));
    var t = el('text', {
      x: GLASS_MID_X, y: GLASS_MID_Y, 'text-anchor': 'middle',
      'dominant-baseline': 'central', 'class': 'chip-num'
    });
    t.textContent = label;
    /* "5 & 6" is three times the width of "6". Hold the long ones to the
       glass rather than letting them run over the edge of the bulb. */
    if (label.length > 2) {
      t.setAttribute('textLength', 330);
      t.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
    svg.appendChild(t);
    return svg;
  }

  /* Eight participants took two spots each, and the artwork draws each one as
     its own bulb in its own place -- Peace Church at 5 and 6, MercyOne at 15
     and 17, EXIT at 24 and 26. They are one participant with two displays, so
     the page treats them as one everywhere a person reads a name: one row in
     the list carrying both bulbs, one card carrying both, and both bulbs
     lighting whichever of them is chosen.

     Grouped by name, because that is what makes two markers one participant:
     the pairs are mostly not consecutive, the two markers have different ids,
     and nothing else in the data ties them to each other.

     The markers on the map stay one per spot. The map says where each display
     actually is, and that does not change. */
  var ROWS = [];               // one per participant, in map order
  var ROW_OF = {};             // index into DATA.spots -> index into ROWS
  (function groupSpots() {
    var at = {};
    DATA.spots.forEach(function (sp, i) {
      /* An unnamed spot merges with nothing -- an empty name is missing data,
         not something several spots have in common. */
      var key = sp.name || ('\u0000' + i);
      if (at[key] === undefined) {
        at[key] = ROWS.length;
        ROWS.push({ i: i, name: sp.name, free: !!sp.free, cells: [], nums: [] });
      }
      var row = ROWS[at[key]];
      /* One cell per display: the number as printed, and the bulb it belongs
         to, so a row can draw its bulbs without pairing two lists by index. */
      row.cells.push({ id: sp.id, n: (sp.nums || [])[0] });
      (sp.nums || []).forEach(function (n) {
        if (row.nums.indexOf(n) < 0) row.nums.push(n);
      });
      ROW_OF[i] = at[key];
    });
  })();

  function rowOf(i) { return ROWS[ROW_OF[i]]; }

  /* Light the bulbs for a spot and put out whatever was lit before. Picking a
     name off the list can land on a bulb anywhere on the map, often outside
     the view, so it keeps flashing until something else is chosen -- a single
     blink would be over before the map had finished moving. */
  /* The hover warmth. Separate from `is-on` so the chosen bulb keeps its
     own, stronger light whether or not the pointer is over it. */
  function warmBulb(sp, on) {
    var layer = document.querySelector('.bulbs');
    if (!layer) return;
    (sp.nums || []).forEach(function (n) {
      var found = layer.querySelectorAll('[data-spot~="' + n + '"]');
      for (var k = 0; k < found.length; k++) {
        found[k].classList.toggle('is-warm', !!on);
      }
    });
  }

  function lightBulb(nums) {
    var layer = document.querySelector('.bulbs');
    if (!layer) return;
    var lit = layer.querySelectorAll('.is-on');
    for (var k = 0; k < lit.length; k++) lit[k].classList.remove('is-on');
    if (!nums) return;
    nums.forEach(function (n) {
      var found = layer.querySelectorAll('[data-spot~="' + n + '"]');
      for (var k = 0; k < found.length; k++) {
        found[k].classList.add('is-on');
        /* SVG has no z-index: later siblings paint over earlier ones, and in
           the crowded stretches a swelling bulb would come up underneath its
           neighbours. Move it to the end so it swells over them. The
           lettering still sits above, in its own layer, so a name is never
           covered. */
        layer.appendChild(found[k]);
      }
    });
  }

  function select(i, move) {
    var sp = DATA.spots[i];
    if (!sp) return;
    if (isPhone()) {
      /* The card is a sheet over the map: picking a name puts the list away
         so the map, the lit bulb and the card are what is on screen. */
      if (panel.classList.contains('open')) togglePanel(false, true);
    } else if (!panel.classList.contains('open')) {
      /* The card lives at the foot of the list, so there is nowhere for it
         to show if the list is shut -- picking a bulb on the map opens it. */
      togglePanel(true, true);
    }
    if (active !== null && mkEls[active]) mkEls[active].classList.remove('is-active');
    leaveEvents();
    active = i;
    mkEls[i].classList.add('is-active');
    var row = rowOf(i);
    lightBulb(row.nums);

    var cardN = document.getElementById('cardN');
    cardN.textContent = '';
    /* One bulb per display, side by side, the same way the row in the list
       shows them -- a participant with two spots reads as one either way. */
    row.cells.forEach(function (c) {
      var chip = bulbChip(c.id, bulbColour[c.n]);
      cardN.appendChild(chip || document.createTextNode(c.id));
    });

    /* The logo, for the 30 participants who sent one. Loaded only when a card
       opens -- all 26 of them at once would be a needless download for anyone
       who never taps a bulb. */
    var logo = document.getElementById('cardLogo');
    if (sp.logo) {
      logo.src = 'assets/logos/' + sp.logo;
      logo.alt = sp.name;
      logo.hidden = false;
    } else {
      logo.removeAttribute('src');
      logo.alt = '';
      logo.hidden = true;
    }

    fillLinks(sp);

    document.getElementById('cardName').textContent = rowName(row);
    /* The bulbs are pictures as far as a screen reader is concerned, so the
       card says in words which spots it is for. */
    card.setAttribute('aria-label', spotWord(row) + ': ' + rowName(row));

    /* The spots still for sale offer themselves. */
    var book = document.getElementById('cardBook');
    if (book) {
      if (row.free && DATA.booking) {
        book.href = DATA.booking.href;
        book.textContent = DATA.booking.label;
        book.hidden = false;
      } else {
        book.removeAttribute('href');
        book.textContent = '';
        book.hidden = true;
      }
    }
    /* A card with no logo is a short card, and short cards made the panel
       jump about as you stepped through them. Given a floor instead. */
    card.classList.toggle('no-logo', !sp.logo);
    /* No line of wording for the spot numbers: the bulbs at the top of the
       card are the numbers, drawn the same way the map draws them, and
       saying "Spots 51 & 52" under two bulbs marked 51 and 52 only repeats
       them. spotWord() still names them for a screen reader, below. */
    /* Previous and Next say where they go. */
    var r = ROW_OF[i], L = ROWS.length;
    nameNav('prev', ROWS[(r - 1 + L) % L]);
    nameNav('next', ROWS[(r + 1) % L]);

    card.classList.remove('peek');
    card.hidden = false;
    sheetInset();
    /* On a phone the bulb is brought up into the window above the sheet
       whether it was picked off the list or tapped on the map -- a tapped
       bulb is often exactly where the sheet is about to rise. */
    if (move || isPhone()) focusSpot(sp);
  }

  /* "Spot 2" over "RISE LTD.", or "Spots 5 & 6" over "Peace Church": the
     neighbour each button steps to. */
  function nameNav(which, row) {
    var k = document.getElementById(which + 'K');
    var n = document.getElementById(which + 'N');
    if (!k || !n) return;
    var word = spotWord(row);
    k.textContent = which === 'prev' ? '\u2190 ' + word : word + ' \u2192';
    n.textContent = rowName(row);
  }

  /* Steps between participants rather than spots. Stepping by spot would show
     the same card twice over for the eight that have two. */
  function step(d) {
    if (active === null) return;
    var r = (ROW_OF[active] + d + ROWS.length) % ROWS.length;
    select(ROWS[r].i, true);
  }

  /* The Floral Hall card: the special events, in place of a display. The
     same card, so it docks in the list on a wide screen and rises as the
     sheet on a phone like any other; the text comes from the template in
     index.html, where it can be edited by hand. */
  function openEvents() {
    var tpl = document.getElementById('eventsCard');
    var text = document.getElementById('cardText');
    if (!tpl || !text) return;
    if (isPhone()) {
      if (panel.classList.contains('open')) togglePanel(false, true);
    } else if (!panel.classList.contains('open')) {
      togglePanel(true, true);
    }
    if (active !== null && mkEls[active]) mkEls[active].classList.remove('is-active');
    lightBulb(null);
    active = null;
    if (hallEl) hallEl.classList.add('is-active');

    document.getElementById('cardN').textContent = '';
    document.getElementById('cardName').textContent = 'Special events at Floral Hall';
    text.textContent = '';
    text.appendChild(tpl.content.cloneNode(true));
    text.hidden = false;
    var logo = document.getElementById('cardLogo');
    logo.removeAttribute('src'); logo.alt = ''; logo.hidden = true;
    document.getElementById('cardLinks').hidden = true;
    var book = document.getElementById('cardBook');
    if (book) { book.removeAttribute('href'); book.textContent = ''; book.hidden = true; }
    card.classList.add('card-info');
    card.classList.remove('no-logo');
    card.setAttribute('aria-label', 'Special events at Floral Hall');

    card.classList.remove('peek');
    card.hidden = false;
    sheetInset();
    /* On a phone the hall is brought up into the window above the sheet,
       as a bulb is. On a wide screen the map stays where it is. */
    if (isPhone()) {
      focusSpot({ x: (FLORAL_HALL.x + FLORAL_HALL.w / 2) / DATA.page.w,
                  y: (FLORAL_HALL.y + FLORAL_HALL.h / 2) / DATA.page.h });
    }
  }

  function leaveEvents() {
    if (!card.classList.contains('card-info')) return;
    card.classList.remove('card-info');
    var text = document.getElementById('cardText');
    if (text) { text.textContent = ''; text.hidden = true; }
    if (hallEl) hallEl.classList.remove('is-active');
  }

  function closeCard() {
    card.hidden = true;
    card.classList.remove('peek');
    leaveEvents();
    if (active !== null && mkEls[active]) mkEls[active].classList.remove('is-active');
    lightBulb(null);
    active = null;
    /* The sheet is gone, so the map may use the whole stage again. */
    if (sheetH) {
      sheetInset();
      constrain();
      apply();
    }
  }

  /* The logo arrives after the card has opened. The sheet's box is fixed on a
     phone so this changes nothing there, but a wide screen's card grows, and
     either way the height is re-read so nothing is left measured short. */
  document.getElementById('cardLogo').addEventListener('load', sheetInset);

  /* The handle on the phone sheet: down to just the name, and back up. */
  document.getElementById('cardHandle').addEventListener('click', function () {
    card.classList.toggle('peek');
    sheetInset();
    constrain();
    apply();
  });

  document.getElementById('cardX').addEventListener('click', closeCard);
  document.getElementById('prev').addEventListener('click', function () { step(-1); });
  document.getElementById('next').addEventListener('click', function () { step(1); });

  /* ---------- list + search ---------- */

  /* What to call a row. A spot nobody has taken yet is not a blank -- it is
     for sale, and says so. The name stays empty in the data: it is what keeps
     two free spots from merging into one row, and it is what guarantees a
     withdrawn business's name cannot come back. */
  function rowName(row) {
    return row.name || (row.free && DATA.booking ? DATA.booking.name : '');
  }

  function rowMatches(row, term) {
    if (rowName(row).toLowerCase().indexOf(term) >= 0) return true;
    for (var k = 0; k < row.cells.length; k++) {
      if (String(row.cells[k].id).toLowerCase().indexOf(term) >= 0) return true;
    }
    return row.nums.indexOf(parseInt(term, 10)) >= 0;
  }

  /* One row per participant, not per display. The eight with two spots carry
     both bulbs side by side rather than appearing twice under the same name,
     which read as a duplicate rather than as two displays. */
  function renderList(term) {
    term = (term || '').trim().toLowerCase();
    listEl.innerHTML = '';
    var shown = 0, named = 0;
    ROWS.forEach(function (row) {
      if (term && !rowMatches(row, term)) return;
      var li = document.createElement('li');
      var b  = document.createElement('button');
      b.innerHTML = '<span class="n"></span><span class="nm"></span>';
      b.lastChild.textContent = rowName(row);
      if (row.free) b.lastChild.className = 'nm nm-free';
      /* The numbers are bulbs, like they are on the map. They are decoration
         as far as a screen reader is concerned -- the button says the spots
         and the participant in words. */
      row.cells.forEach(function (c) {
        var chip = bulbChip(c.id, bulbColour[c.n]);
        b.firstChild.appendChild(chip || document.createTextNode(c.id));
      });
      b.setAttribute('aria-label', spotWord(row) + ': ' + rowName(row));
      /* Hovering a row shows that participant's own bulb colour, so the list
         and the map agree before you have even clicked. Written out as rgba
         here rather than mixed in CSS: the alpha has to vary between the hover
         and the number chip, and one channel-separated value does both. Two
         spots can be two colours; the row takes the first. */
      var tint = bulbTint[row.nums[0]];
      if (tint) {
        b.style.setProperty('--row-hover', tint + '.3)');
        b.style.setProperty('--row-chip', tint + '.9)');
      }
      b.addEventListener('click', function () { select(row.i, true); });
      li.appendChild(b);
      listEl.appendChild(li);
      shown++;
      if (row.name) named++;
    });
    if (!shown) {
      var p = document.createElement('li');
      p.className = 'empty';
      p.textContent = 'Nothing matches “' + term + '”.';
      listEl.appendChild(p);
    }
    /* The same count as the header, so the two never disagree. The rows with
       no name yet are shown but not counted -- there is nobody to count. */
    countEl.textContent = named === PARTICIPANTS
      ? tally(PARTICIPANTS)
      : named + ' of ' + tally(PARTICIPANTS);
  }

  /* On a wide screen the list is open and stays open. There is no close
     button, nothing closes it from the map, and Escape does not either -- it
     is part of the page, not a drawer over it. It is still a function because
     the map has to be re-framed around it once it is in place.

     On a phone it opens and closes: DISPLAYS on the bar brings it up over the
     map, MAP puts it away, and picking a name puts it away too.

     `quiet` is for opening it on load: taking the caret into the search box
     before anyone has asked for it would put a keyboard up on a tablet and
     move the page's focus for no reason. */
  function togglePanel(open, quiet) {
    if (!isPhone()) open = true;
    var changed = panel.classList.contains('open') !== open;
    panel.classList.toggle('open', open);
    if (tabMap) {
      tabMap.classList.toggle('is-active', !open);
      tabMap.setAttribute('aria-pressed', open ? 'false' : 'true');
      tabList.classList.toggle('is-active', open);
      tabList.setAttribute('aria-pressed', open ? 'true' : 'false');
    }
    remeasureList();
    if (open && !quiet && !('ontouchstart' in window)) qEl.focus();
    /* On a wide screen the list covers part of the stage, so its arrival
       changes where the middle of the map is. Re-frame it, unless the map
       has been moved by hand -- then it is the reader's view, not ours to
       take back. On a phone the list covers the whole map and leaves it
       where it was. */
    if (changed && untouched && !isPhone()) home();
  }

  if (tabMap) {
    tabMap.addEventListener('click', function () { togglePanel(false); });
    tabList.addEventListener('click', function () { togglePanel(true); });
  }

  qEl.addEventListener('input', function () { renderList(qEl.value); });

  /* ---------- pan ---------- */

  var pts = {}, last = null, pinch = null, moved = 0, dragged = false;

  /* Pointer capture is deliberately NOT used here: capturing on the stage
     stops the click from ever reaching a marker button underneath. Instead
     the move/up listeners live on window for the duration of the gesture. */
  stage.addEventListener('pointerdown', function (e) {
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pts);
    if (ids.length === 1) {
      last = { x: e.clientX, y: e.clientY };
      moved = 0;
      dragged = false;
      stage.classList.add('dragging');
    } else if (ids.length === 2) {
      pinch = startPinch(ids);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  });

  function startPinch(ids) {
    var a = pts[ids[0]], b = pts[ids[1]];
    var r = stage.getBoundingClientRect();
    return {
      d: Math.hypot(a.x - b.x, a.y - b.y),
      s: view.s,
      cx: (a.x + b.x) / 2 - r.left,
      cy: (a.y + b.y) / 2 - r.top
    };
  }

  function onMove(e) {
    if (!pts[e.pointerId]) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pts);

    if (ids.length >= 2 && pinch) {
      var a = pts[ids[0]], b = pts[ids[1]];
      var d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.d > 0) setScale(pinch.s * (d / pinch.d), pinch.cx, pinch.cy);
      return;
    }
    if (ids.length === 1 && last) {
      var dx = e.clientX - last.x, dy = e.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      view.x += dx;
      view.y += dy;
      last = { x: e.clientX, y: e.clientY };
      if (moved > 6) dragged = true;
      constrain();
      apply();
    }
  }

  function release(e) {
    delete pts[e.pointerId];
    var ids = Object.keys(pts);
    if (ids.length < 2) pinch = null;
    if (ids.length === 1) last = pts[ids[0]];
    if (!ids.length) {
      last = null;
      stage.classList.remove('dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    }
  }

  /* ---------- wheel + keys ---------- */

  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    var r = stage.getBoundingClientRect();
    var f = Math.pow(1.0016, -e.deltaY);
    setScale(view.s * f, e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  stage.addEventListener('dblclick', function (e) {
    var r = stage.getBoundingClientRect();
    setScale(view.s * 1.8, e.clientX - r.left, e.clientY - r.top);
  });

  document.addEventListener('keydown', function (e) {
    /* Escape closes the card, never the list. */
    if (e.key === 'Escape') closeCard();
    if (e.target === qEl) return;
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === '+' || e.key === '=') zoomBy(1.3);
    if (e.key === '-') zoomBy(1 / 1.3);
  });

  function zoomBy(f) {
    setScale(view.s * f, stage.clientWidth / 2, stage.clientHeight / 2);
  }
  document.getElementById('zIn').addEventListener('click', function () { zoomBy(1.4); });
  document.getElementById('zOut').addEventListener('click', function () { zoomBy(1 / 1.4); });
  document.getElementById('zFit').addEventListener('click', function () { home(); closeCard(); });

  /* ---------- boot ---------- */

  var img = document.getElementById('basemap');
  var untouched = true;
  function boot() {
    renderList('');
    /* After the map's own typeface has arrived, not before: the widths this
       measures are the widths it is drawn at, and the fallback font's are
       not the same. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(declutter);
    } else {
      declutter();
    }
    placeCard();
    /* On a wide screen the list is open from the start and nothing closes
       it but the reader. It is half of what this page is for, and the card
       opens at the foot of it -- a closed list would have nowhere to show
       the detail. home() runs inside togglePanel() once the list is in
       place, so the map is framed in the width the list leaves rather than
       being framed and then covered.

       A phone starts on the map, with the list behind DISPLAYS. */
    togglePanel(!isPhone(), true);
    if (isPhone()) home();
  }
  if (img.complete) boot();
  else img.addEventListener('load', boot);

  stage.addEventListener('pointerdown', function () { untouched = false; });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      remeasureList();
      sheetInset();
      if (untouched) home();          // still the opening view: re-frame it
      else { measure(); constrain(); apply(); }
    }, 120);
  });

  /* Crossing 660px either way: the card changes homes, and the list is
     opened (wide) or left as it is (phone). */
  if (PHONE) {
    var onShape = function () {
      placeCard();
      togglePanel(!isPhone() || panel.classList.contains('open'), true);
      sheetInset();
      remeasureList();
      if (untouched) home();
      else { measure(); constrain(); apply(); }
    };
    if (PHONE.addEventListener) PHONE.addEventListener('change', onShape);
    else if (PHONE.addListener) PHONE.addListener(onShape);
  }

})();
