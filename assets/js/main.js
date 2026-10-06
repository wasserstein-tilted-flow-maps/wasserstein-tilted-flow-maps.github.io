/* WTF project page: tables, tabs, BibTeX copy, lightbox, nav highlight, design picker. */
(function () {
  'use strict';

  /* ---------------- results tables (transcribed from the paper, Tables 6 and 7) ---------------- */
  // [method, NFE, HPSv2, PickScore, ImageReward, DreamSim, CLIP, isOurs]
  const T2I = [
    ['Base model', 1, 0.228, 20.36, 0.182, 0.548, 0.413],
    ['Base model', 4, 0.255, 21.06, 0.665, 0.426, 0.346],
    ['Base model', 8, 0.264, 21.29, 0.801, 0.361, 0.296],
    ['Base model', 50, 0.274, 21.58, 0.997, 0.281, 0.239],
    ['Adjoint Matching', 50, 0.357, 22.75, 1.380, 0.210, 0.188],
    ['Flow-GRPO', 50, 0.303, 22.06, 1.210, 0.250, 0.215],
    ['WTF (ours)', 1, 0.347, 22.31, 1.069, 0.325, 0.289, true],
    ['WTF (ours)', 4, 0.401, 22.97, 1.383, 0.250, 0.220, true],
    ['WTF (ours)', 8, 0.400, 22.93, 1.394, 0.233, 0.212, true],
    ['WTF (ours)', 50, 0.398, 22.87, 1.416, 0.217, 0.205, true],
  ];
  const IMAGENET = [
    ['Base model', 1, 0.214, 19.21, -0.271, 0.790, 0.350],
    ['Base model', 250, 0.218, 19.45, -0.252, 0.841, 0.340],
    ['Adjoint Matching', 250, 0.243, 20.26, 0.005, 0.453, 0.237],
    ['MFM', 250, 0.291, 19.83, 0.544, 0.379, 0.189],
    ['VFM', 1, 0.307, 20.91, 0.860, 0.482, 0.194],
    ['WTF (ours)', 1, 0.319, 20.24, 0.612, 0.482, 0.201, true],
    ['WTF (ours)', 250, 0.330, 20.45, 0.718, 0.460, 0.177, true],
  ];
  const NOTES = {
    t2i: 'TiM-T2I, HPSv2 as the training reward. Every method is fine-tuned under the same budget of roughly 48 GPU-hours on one 8×H100 node. WTF is one fine-tuned flow map evaluated at four inference budgets. Highest value among fine-tuned methods in each reward column is highlighted.',
    imagenet: 'DMF-XL/2, HPSv2 as the training reward. WTF is evaluated at 1 and 250 NFE from the same fine-tuned flow map, and its results are means over three matched seeds. Highest value among fine-tuned methods in each reward column is highlighted.',
  };

  function buildTable(rows, id) {
    const el = document.getElementById(id);
    if (!el) return;
    const decs = [3, 2, 3, 3, 3];
    // best reward among fine-tuned rows (exclude base), reward columns only (idx 2..4)
    const tuned = rows.filter(r => !/^Base/.test(r[0]));
    const best = [2, 3, 4].map(c => Math.max(...tuned.map(r => r[c])));
    let h = '<thead><tr><th class="ta-l" rowspan="1"></th><th></th>' +
      '<th colspan="3">Reward ↑</th><th colspan="2">Diversity ↑</th></tr>' +
      '<tr><th class="ta-l">Method</th><th>NFE</th><th>HPSv2</th><th>PickScore</th><th>ImageReward</th>' +
      '<th>DreamSim</th><th>CLIP</th></tr></thead><tbody>';
    let prevGroup = null;
    rows.forEach(r => {
      const group = /^Base/.test(r[0]) ? 'base' : (r[7] ? 'ours' : 'baseline');
      const cls = [r[7] ? 'ours-row' : '', group !== prevGroup && prevGroup ? 'group-start' : ''].join(' ').trim();
      prevGroup = group;
      h += `<tr class="${cls}"><td class="ta-l${group === 'base' ? ' muted' : ''}">${r[0]}</td><td>${r[1]}</td>`;
      for (let c = 2; c <= 6; c++) {
        const v = r[c], txt = (v < 0 ? '−' : '') + Math.abs(v).toFixed(decs[c - 2]);
        const isBest = c <= 4 && group !== 'base' && Math.abs(v - best[c - 2]) < 1e-9;
        h += `<td${isBest ? ' class="best"' : ''}>${txt}</td>`;
      }
      h += '</tr>';
    });
    el.innerHTML = h + '</tbody>';
  }
  buildTable(T2I, 'tbl-t2i');
  buildTable(IMAGENET, 'tbl-imagenet');
  const note = document.getElementById('table-note');
  if (note) note.textContent = NOTES.t2i;

  document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.seg-btn').forEach(b => {
        const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on);
      });
      document.querySelectorAll('[data-table]').forEach(t => t.classList.toggle('is-hidden', t.dataset.table !== tab));
      if (note) note.textContent = NOTES[tab];
    });
  });

  // placeholder links (e.g. Code before release) should not jump to the top
  document.querySelectorAll('.btn-soon').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  /* ---------------- BibTeX copy ---------------- */
  const copyBtn = document.getElementById('copy-bib');
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById('bibtex').textContent);
      copyBtn.textContent = 'Copied'; setTimeout(() => copyBtn.textContent = 'Copy', 1600);
    } catch (e) { copyBtn.textContent = 'Copy failed'; }
  });

  /* ---------------- lightbox ---------------- */
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<img alt=""><div class="lightbox-hint">click anywhere or press Esc to close</div>';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector('img');
  document.querySelectorAll('.figure-hero img, .figure-clean img, .teaser img').forEach(img => {
    img.addEventListener('click', () => { lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; lb.classList.add('open'); });
  });
  lb.addEventListener('click', () => lb.classList.remove('open'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('open'); });

  /* ---------------- nav active-section highlight ---------------- */
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => obs.observe(s));

  /* ---------------- design-option picker (review only: add ?options to the URL) ---------------- */
  const picker = document.getElementById('theme-picker');
  if (picker && new URLSearchParams(location.search).has('options')) {
    picker.classList.add('show');
    const sync = () => {
      const cur = document.documentElement.getAttribute('data-theme');
      picker.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.themeSet === cur));
    };
    picker.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', b.dataset.themeSet);
      const q = new URLSearchParams(location.search); q.set('theme', b.dataset.themeSet);
      history.replaceState(null, '', '?' + q.toString() + location.hash);
      sync(); document.dispatchEvent(new Event('themechange'));
    }));
    sync();
  }
})();

/* review aid: ?review loads every lazy image and the animation up front (for full-page screenshots) */
(() => {
  if (!new URLSearchParams(location.search).has("review")) return;
  document.querySelectorAll("img[loading=lazy]").forEach(i => { i.loading = "eager"; });
  const v = document.getElementById("tilt-anim");
  if (v) { v.poster = v.dataset.poster; v.preload = "auto"; v.load(); }
})();
