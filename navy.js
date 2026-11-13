/* The navy map (navy.css): the bulb numbers are plain text in the
   lettering layer, like the names, so mark them to keep them dark on the
   bulbs' glass while the names go light. */
(function () {
  var svg = document.getElementById('textlayer');
  if (!svg) return;
  [].forEach.call(svg.querySelectorAll('text'), function (t) {
    if (/^\s*\d{1,2}\s*$/.test(t.textContent)) t.classList.add('num');
  });
})();
