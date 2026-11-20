/* Sets the theme before first paint (no flash). External file so CSP can block inline scripts. */
try {
  var t = localStorage.getItem('folderly:theme') || 'system';
  var d = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = d ? 'dark' : 'light';
} catch (e) {}
