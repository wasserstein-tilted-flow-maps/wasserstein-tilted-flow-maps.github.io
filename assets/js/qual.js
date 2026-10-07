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
  /* Reel: slides sit side by side, the active one centred with its neighbours dimmed at the edges.
     The track holds K clones of the last slides before the first and of the first slides after the last,
     so moving past either end continues seamlessly and then snaps (without animation) to the real slide.
     It advances by itself every DWELL ms while on screen and pauses under the pointer. Any manual control
     (arrows, a click on a neighbour, horizontal scroll or swipe, arrow keys) stops the auto-advance until
     the gallery leaves the screen and comes back. */
  const reel = document.getElementById('qual');
  if (!reel) return;
  const win = reel.querySelector('.reel-window'), track = reel.querySelector('.reel-track');
  const counter = reel.querySelector('.reel-counter'), prog = reel.querySelector('.reel-progress'), bar = prog.querySelector('i');
  const DWELL = 5000, K = 2, still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tab = 't2i', n = 0, pos = K, slides = [], elapsed = 0, last = 0, raf = 0;
  let hover = false, inView = false, user = false;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const slideHTML = (s) => `<figure class="reel-slide">
      <div class="qual-labels" style="grid-template-columns:repeat(${s.labels.length},1fr)">${
        s.labels.map(l => `<span class="${l.startsWith('WTF') ? 'ours' : ''}">${l}</span>`).join('')}</div>
      <img loading="lazy" decoding="async" src="${s.src}" alt="${esc(s.text)}">
      <figcaption class="qual-prompt">${esc(s.text)}</figcaption></figure>`;
  const real = () => ((pos - K) % n + n) % n;
  const layout = (animate = true) => {
    if (!slides.length) return;
    const W = win.clientWidth, sw = slides[0].offsetWidth, gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.style.transition = animate ? '' : 'none';
    slides.forEach(s => { s.style.transition = animate ? '' : 'none'; });
    track.style.transform = `translateX(${(W - sw) / 2 - pos * (sw + gap)}px)`;
    slides.forEach((s, i) => s.classList.toggle('active', i === pos));
    [pos, pos - 1, pos + 1, pos + 2].forEach(j => { if (slides[j]) slides[j].querySelector('img').loading = 'eager'; });
    counter.textContent = `${real() + 1} / ${n}`;
    if (!animate) { void track.offsetWidth; track.style.transition = ''; slides.forEach(s => { s.style.transition = ''; }); }
  };
  // after sliding onto a clone, jump to the real slide with the same content
  const normalize = () => {
    if (pos >= n + K || pos < K) { pos = real() + K; layout(false); }
  };
  track.addEventListener('transitionend', (e) => { if (e.target === track) normalize(); });
  const step = (d) => { normalize(); pos += d; elapsed = 0; layout(); };
  const takeControl = () => { user = true; elapsed = 0; prog.classList.add('off'); };
  const build = () => {
    const items = Q[tab]; n = items.length;
    const all = [...items.slice(n - K), ...items, ...items.slice(0, K)];
    track.innerHTML = all.map(slideHTML).join('');
    slides = [...track.children];
    slides.forEach((s, i) => s.addEventListener('click', () => {
      if (i === pos) return;
      takeControl(); normalize();
      pos += (i - pos); elapsed = 0; layout();
    }));
    pos = K; elapsed = 0; layout(false);
  };
  const tick = (now) => {
    if (last && !hover && !user && !still) elapsed += now - last;
    last = now;
    if (elapsed >= DWELL) step(1);
    bar.style.width = `${Math.min(100, 100 * elapsed / DWELL)}%`;
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver((es) => es.forEach(e => {
    inView = e.isIntersecting;
    if (inView && !raf) { last = 0; raf = requestAnimationFrame(tick); }
    if (!inView) {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      user = false; elapsed = 0; prog.classList.remove('off');      // auto-advance resumes on the next visit
    }
  }), { threshold: 0.35 }).observe(reel);
  reel.addEventListener('mouseenter', () => { hover = true; });
  reel.addEventListener('mouseleave', () => { hover = false; });
  reel.querySelector('.prev').addEventListener('click', (e) => { e.stopPropagation(); takeControl(); step(-1); });
  reel.querySelector('.next').addEventListener('click', (e) => { e.stopPropagation(); takeControl(); step(1); });
  let acc = 0, lock = 0;
  win.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (performance.now() < lock) return;
    acc += e.deltaX;
    if (Math.abs(acc) > 40) { takeControl(); step(Math.sign(acc)); acc = 0; lock = performance.now() + 550; }
  }, { passive: false });
  let x0 = null;
  win.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  win.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { takeControl(); step(-Math.sign(dx)); }
  }, { passive: true });
  document.addEventListener('keydown', (e) => {
    if (!inView) return;
    if (e.key === 'ArrowLeft') { takeControl(); step(-1); } else if (e.key === 'ArrowRight') { takeControl(); step(1); }
  });
  document.querySelectorAll('#qual-tabs .pill-tab').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#qual-tabs .pill-tab').forEach(x => x.classList.toggle('active', x === b));
    tab = b.dataset.qual; build();
  }));
  addEventListener('resize', () => layout(false));
  build();
})();
