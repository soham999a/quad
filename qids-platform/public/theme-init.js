// Pre-paint theme resolution — loaded synchronously from index.html.
// Kept as a static file (not inline) so the Content-Security-Policy can run
// without 'unsafe-inline' script allowances.
(function () {
  try {
    var t = localStorage.getItem('qids-theme');
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.dataset.theme = t;
    document.documentElement.style.colorScheme = t;
  } catch (e) {}
})();
