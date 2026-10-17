/* DateMeUp · Loading helpers. No dependencies. Spec: LOADING.md
   Timing: show nothing for the first 300 ms (fast responses never flash a loader);
   once shown, keep it at least 500 ms so it never blinks. */
(function(){
  const DELAY = 300, MIN = 500;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const LOGO = '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="l-chev" d="M33 24L50 11L67 24" fill="none" stroke="#0E8C8C" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><g transform="rotate(8 34 82)"><g class="l-a"><circle cx="34" cy="47" r="12" fill="#0E8C8C"/><path d="M17 98V80a17 17 0 0 1 34 0v18z" fill="#0E8C8C"/></g></g><g transform="rotate(-8 66 84)"><g class="l-b"><circle cx="66" cy="49" r="12" fill="#7CB518"/><path d="M49 98V82a17 17 0 0 1 34 0v16z" fill="#7CB518"/></g></g></svg>';

  const MONO = LOGO.replace(/#0E8C8C|#7CB518/g,'currentColor');
  const loaderHTML = (label, size) => '<div class="dmu-loader" role="status" style="--dmu-loader-size:' + size + 'px">' + LOGO + (label ? '<span class="l-text">' + label + '</span>' : '') + '</div>';

  // Core: runs task(), shows/hides a loader with delay + min duration.
  async function withLoader(task, show, hide, opts = {}){
    const delay = opts.delay ?? DELAY, min = opts.min ?? MIN;
    let shownAt = 0;
    const t = setTimeout(() => { shownAt = performance.now(); show(); }, delay);
    try { return await task(); }
    finally {
      clearTimeout(t);
      if (shownAt) { const left = min - (performance.now() - shownAt); if (left > 0) await wait(left); hide(); }
    }
  }

  // 1) Buttons / forms: blocks duplicate submits immediately (no delay on the lock).
  async function button(btn, task, opts){
    if (btn.dataset.busy) return;               // second click while running = ignored
    btn.dataset.busy = '1'; btn.disabled = true;
    const form = btn.form; if (form) form.dataset.busy = '1';
    const label = btn.textContent;
    try {
      return await withLoader(task,
        () => { btn.style.width = btn.offsetWidth + 'px'; btn.setAttribute('aria-busy','true'); btn.setAttribute('aria-label', (opts && opts.busyLabel) || 'Working…'); const s = document.createElement('span'); s.className = 'dmu-btn-loader'; s.innerHTML = MONO; btn.append(s); },
        () => { btn.removeAttribute('aria-busy'); btn.removeAttribute('aria-label'); btn.style.width = ''; btn.querySelectorAll('.dmu-btn-loader').forEach(n => n.remove()); }, opts);
    } finally {
      delete btn.dataset.busy; btn.disabled = false; if (form) delete form.dataset.busy; btn.textContent = label;
    }
  }

  // 2) Content regions: centred logo loader (or skeletons if opts.skeleton is set), then renders results with a fade-up.
  //    render(data) must return an HTML string or Node.
  async function region(el, task, render, opts = {}){
    const token = (el._dmuToken = (el._dmuToken || 0) + 1);   // newest request wins (search-as-you-type)
    const skel = opts.skeleton || el.dataset.skeleton;
    el.setAttribute('aria-busy','true');
    el.style.setProperty('--dmu-region-min', el.offsetHeight + 'px');
    let data, err;
    try {
      data = await withLoader(task, () => { if (token !== el._dmuToken) return; el.innerHTML = skel ? document.getElementById(skel).innerHTML : '<div class="dmu-region-loader">' + loaderHTML(opts.label || 'Loading…', opts.size || 56) + '</div>'; }, () => {}, opts);
    } catch(e){ err = e; }
    if (token !== el._dmuToken) return;          // a newer request took over
    el.removeAttribute('aria-busy');
    el.style.removeProperty('--dmu-region-min');
    const out = err ? (opts.error ? opts.error(err) : '<p class="dmu-load-error">That didn’t load. <button class="dmu-btn dmu-btn-ghost" data-retry>Try again</button></p>') : render(data);
    el.classList.remove('dmu-enter'); void el.offsetWidth; el.classList.add('dmu-enter');
    if (typeof out === 'string') el.innerHTML = out; else el.replaceChildren(out);
    [...el.children].forEach((c,i) => c.style.setProperty('--i', Math.min(i, 8)));
    const retry = el.querySelector('[data-retry]'); if (retry) retry.onclick = () => region(el, task, render, opts);
    return data;
  }

  // 3) Page / route: top bar + logo overlay. Use around route loaders.
  let overlay, bar, timer;
  function ensure(){
    if (overlay) return;
    overlay = document.createElement('div'); overlay.className = 'dmu-page-loading'; overlay.setAttribute('role','status'); overlay.setAttribute('aria-live','polite');
    overlay.innerHTML = '<div class="dmu-loader">' + LOGO + '<span class="l-text">Loading…</span></div>';
    bar = document.createElement('div'); bar.className = 'dmu-progress';
    document.body.append(bar, overlay);
  }
  async function page(task, opts = {}){
    ensure();
    overlay.querySelector('.l-text').textContent = opts.label || 'Loading…';
    document.body.setAttribute('aria-busy','true');
    return withLoader(task,
      () => { bar.classList.add('is-on'); let p = 10; bar.style.setProperty('--p', p + '%'); timer = setInterval(() => { p += (90 - p) * .12; bar.style.setProperty('--p', p + '%'); }, 200); if (opts.overlay !== false) overlay.classList.add('is-on'); },
      async () => { clearInterval(timer); bar.style.setProperty('--p','100%'); overlay.classList.remove('is-on'); await wait(250); bar.classList.remove('is-on'); bar.style.setProperty('--p','0%'); },
      opts).finally(() => document.body.removeAttribute('aria-busy'));
  }

  window.DMU = window.DMU || {};
  window.DMU.loading = { button, region, page, withLoader, LOGO, MONO, loaderHTML };
})();
