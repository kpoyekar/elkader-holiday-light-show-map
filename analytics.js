/* Elkader Holiday Light Show map: Google Analytics (GA4)
   Property "Holiday Light Show Map" in the Main Street Elkader account,
   measurement ID G-Y063ZQXBYL.

   Kept in its own file so app.js is untouched: everything here listens
   for clicks on the page and reads what the map has put on screen.

   Events sent (all show up under Reports > Engagement > Events):
     page_view       every load, with `embedded` = yes/no (inside the City
                     site's iframe or opened on its own)
     bulb_tap        a bulb tapped on the map
     list_pick       a display picked from the DISPLAYS list
     display_view    any card opened, however it was reached (map, list,
                     prev/next arrows, the K8Ki credit) -- the one to use
                     for "which displays were looked at most"
     sponsor_link    a website / Facebook / Instagram link on a card
     map_search      what people typed in the search box (sent once they
                     stop typing for a second and a half)
     events_open     the Floral Hall events card opened
   Every display event carries `display_name` and `display_number`. */
(function () {
  'use strict';

  /* Real visitors only: nothing is sent from a copy on this computer
     (localhost) or from the claude.ai preview, where the map is tried out
     before it goes live and every test load counted as a visit (13 Nov 2026). */
  var host = location.hostname;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) ||
      /(^|\.)claudeusercontent\.com$/.test(host)) return;

  var GA_ID = 'G-Y063ZQXBYL';
  var embedded = window.top !== window.self;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  gtag('js', new Date());
  gtag('config', GA_ID, {
    /* The map nearly always runs inside the City's GoDaddy page, a
       different site, so its cookie must be allowed cross-site or browsers
       drop it. Safari and Firefox still may; visits are counted either way,
       only "returning visitor" gets less reliable. */
    cookie_flags: 'SameSite=None;Secure',
    embedded: embedded ? 'yes' : 'no'
  });

  function send(name, params) {
    try { gtag('event', name, params || {}); } catch (e) {}
  }

  /* What the open card says, read after app.js has filled it in. */
  function currentDisplay() {
    var nameEl = document.getElementById('cardName');
    var numEl = document.getElementById('cardN');
    var card = document.getElementById('card');
    if (!nameEl || !card || card.hidden) return null;
    return {
      display_name: (nameEl.textContent || '').trim(),
      display_number: (numEl && numEl.textContent || '').replace(/\s+/g, ' ').trim()
    };
  }

  /* app.js fills the card in its own click handler; wait one tick for it.
     A drag across the map also ends in a click but opens nothing, so only
     count it if a card is now showing that was not showing before. */
  function afterCardOpens(eventName) {
    var before = currentDisplay();
    var beforeKey = before ? before.display_name + '|' + before.display_number : '';
    setTimeout(function () {
      var d = currentDisplay();
      if (!d || !d.display_name) return;
      if (d.display_name + '|' + d.display_number === beforeKey) return;
      if (eventName) send(eventName, d);
      send('display_view', d);
    }, 0);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var link = t.closest('a.card-link');
    if (link) {
      var d = currentDisplay() || {};
      send('sponsor_link', {
        display_name: d.display_name || '',
        display_number: d.display_number || '',
        link_type: (link.title || '').trim(),
        link_url: link.href
      });
      return;
    }

    if (t.closest('#markers')) {
      /* The Floral Hall marker opens the events card, not a display. */
      var ev = document.getElementById('events');
      var evWasOpen = !!(ev && !ev.hidden);
      setTimeout(function () {
        if (ev && !ev.hidden && !evWasOpen) send('events_open', { via: 'map' });
      }, 0);
      afterCardOpens('bulb_tap');
      return;
    }

    if (t.closest('#list')) { afterCardOpens('list_pick'); return; }

    if (t.closest('#prev, #next, .credit, [data-open]')) { afterCardOpens(null); return; }
  }, true);

  /* Search: the term once typing pauses, ignoring one-letter fragments. */
  var q = document.getElementById('q');
  if (q) {
    var timer, last = '';
    q.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var term = (q.value || '').trim().toLowerCase();
        if (term.length < 2 || term === last) return;
        last = term;
        send('map_search', { search_term: term });
      }, 1500);
    });
  }
})();
