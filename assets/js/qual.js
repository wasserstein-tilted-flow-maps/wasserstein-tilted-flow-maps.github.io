/* WTF project page: tilt animation, Tilt Lab auto-sweep and the qualitative clicker.
   Clicker slides are cut from the paper's own composites (Fig. 1 front_hero, Figs. appx_t2i_1/2) by
   /shared/wtf_launch/page_src/build_qual.py; prompts are verbatim from the paper's captions (Appendix I.2). */
(function () {
  /* ---------- reweight-vs-transport animation: loops while in view, pauses when scrolled away ---------- */
  const vid = document.getElementById('tilt-anim');
  if (vid) {
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { vid.poster = vid.dataset.poster; vid.preload = 'auto'; vid.load(); o.disconnect(); } },
      { rootMargin: '800px 0px' }).observe(vid);
    new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) vid.play().catch(() => {}); else vid.pause(); }),
      { threshold: 0.3 }).observe(vid);
  }

  /* ---------- 1-D demo: sweep the reward location K while in view (FMRG pattern) ----------
     Restarts every time the lab scrolls back into view and pauses when it leaves. Touching a
     control hands it to the reader until the next re-entry. lambda stays at the slider value. */
  const lab = document.getElementById('tilt-lab'), kIn = document.getElementById('lab-k');
  if (lab && kIn && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const K0 = 1.0, K1 = 6.0, PERIOD = 9000;           // ms for a full near -> far -> near cycle
    let raf = 0, t0 = 0, ph0 = 0;
    const setK = (k) => { kIn.value = k.toFixed(2); kIn.dispatchEvent(new Event('input')); };
    const frame = (now) => {
      if (!t0) t0 = now;
      const ph = ph0 + (now - t0) / PERIOD;
      setK(K0 + (K1 - K0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * ph)));
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf) return;
      t0 = 0;
      const e = Math.min(1, Math.max(0, (+kIn.value - K0) / (K1 - K0)));
      ph0 = Math.acos(1 - 2 * e) / (2 * Math.PI);      // continue from where the slider is, no jump
      raf = requestAnimationFrame(frame);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    new IntersectionObserver((es) => es.forEach(e => {
      if (e.isIntersecting) start(); else stop();
    }), { threshold: 0.35 }).observe(lab.querySelector('canvas'));
    lab.querySelector('.lab-controls').addEventListener("pointerdown", stop);
    lab.querySelector('.lab-controls').addEventListener("keydown", stop);
  }

  /* ---------- qualitative clicker ---------- */
  const BUDGET = ['Base', 'WTF · 1 step', 'WTF · 2 steps', 'WTF · 4 steps', 'WTF · 8 steps', 'WTF · 50 steps'];
  const set1 = [
    'A zentangle pizza illustration with colorful ink.',
    'Cross section of an apple in a limited neutral palette with a beautiful graphic design and a painterly style.',
    'Scary African voodoo paintings by Jean-Michel Basquiat.',
    'A digital painting of the legendary water city of Atlantis, featuring a Greek temple, statues, and a red flag.',
    'A pencil sketch of Danny Devito by Milt Kahl.',
    'The image features a surreal fox and skulls in highly detailed, liquid oilpaint style.',
    'An art piece by Wojciech Siudmak depicting an individual gazing at the vast cosmos.',
    'A cobblestone street with a tree over the sea at sunset, illuminated by sun rays.'];
  const set2 = [
    'A painting of a firefall cascading over a high cliff.',
    'An image depicting the concept of yin and yang.',
    'Psytrance artwork by Lee Madgwick.',
    'Artwork depicting a futuristic car, created by Ed Roth.',
    'A night scene of a lavender field with a town and church in the background, reminiscent of Van Gogh.',
    'An image depicting the concept of yin and yang.',
    'Portrait of a creature with bat ears, a wolf snout and eagle features, wearing a poncho and helmet.',
    'The image is a drawing of a skeletal, frail figure driving a chariot pulled by two skeletal hounds.'];
  // ImageNet-256: the paper checkpoint (IN_tcf15_detach_s1 @12500) from /shared/wtf_qual/in_gallery,
  // every panel from the same initial noise (seed 1000*class + k, matched across models and NFE).
  const IN_BUDGET = ['Base · 50 steps', 'WTF · 1 step', 'WTF · 4 steps', 'WTF · 8 steps', 'WTF · 50 steps', 'WTF · 250 steps'];
  const inClasses = [[1, 'Goldfish'], [15, 'Robin'], [22, 'Bald eagle'], [33, 'Loggerhead turtle'], [37, 'Box turtle'],
    [47, 'African chameleon'], [84, 'Peacock'], [88, 'Macaw'], [90, 'Lorikeet'], [94, 'Hummingbird'], [96, 'Toucan'],
    [100, 'Black swan'], [103, 'Platypus'], [105, 'Koala'], [108, 'Sea anemone'], [113, 'Snail'], [122, 'American lobster'],
    [127, 'White stork']];
  const pad = (n) => String(n).padStart(3, '0');
  const Q = {
    t2i: [
      ...set1.map((p, i) => ({ src: `assets/qual/budget/s1_${i}.webp`, labels: BUDGET, text: `“${p}”` })),
      ...set2.map((p, i) => ({ src: `assets/qual/budget/s2_${i}.webp`, labels: BUDGET, text: `“${p}”` })),
    ],
    imagenet: inClasses.map(([c, name]) => ({ src: `assets/qual/imagenet/c${pad(c)}.webp`, labels: IN_BUDGET, text: name })),
  };
  const img = document.getElementById('qual-img');
  if (!img) return;
  const labels = document.getElementById('qual-labels'), prompt = document.getElementById('qual-prompt'),
    counter = document.getElementById('qual-counter'), dots = document.getElementById('qual-dots');
  let tab = 't2i', idx = 0, near = false;
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { near = true; render(); o.disconnect(); } },
    { rootMargin: '600px 0px' }).observe(img);
  const render = () => {
    const s = Q[tab][idx];
    img.src = s.src; img.alt = s.text;
    labels.style.gridTemplateColumns = `repeat(${s.labels.length}, 1fr)`;
    labels.innerHTML = s.labels.map(l => `<span class="${l.startsWith('WTF') ? 'ours' : ''}">${l}</span>`).join('');
    prompt.textContent = s.text;
    counter.textContent = `${idx + 1} / ${Q[tab].length}`;
    dots.querySelectorAll('.qual-dot').forEach((d, i) => d.classList.toggle('on', i === idx));
    if (near) { const nxt = Q[tab][(idx + 1) % Q[tab].length]; new Image().src = nxt.src; }   // preload the next slide
  };
  const build = () => {
    dots.innerHTML = Q[tab].map((_, i) => `<button type="button" class="qual-dot" aria-label="Example ${i + 1}"></button>`).join('');
    dots.querySelectorAll('.qual-dot').forEach((d, i) => d.addEventListener('click', () => { idx = i; render(); }));
    render();
  };
  const step = (d) => { idx = (idx + d + Q[tab].length) % Q[tab].length; render(); };
  document.querySelector('#qual .prev').addEventListener('click', () => step(-1));
  document.querySelector('#qual .next').addEventListener('click', () => step(1));
  document.querySelectorAll('#qual-tabs .pill-tab').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#qual-tabs .pill-tab').forEach(x => x.classList.toggle('active', x === b));
    tab = b.dataset.qual; idx = 0; build();
  }));
  document.addEventListener('keydown', (e) => {
    const r = document.getElementById('qual').getBoundingClientRect();
    if (r.top > innerHeight || r.bottom < 0) return;            // only when the clicker is on screen
    if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
  });
  build();
})();
