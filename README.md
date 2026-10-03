# WTF?! project page

Static project page for *WTF?! Simulation-Free Reinforcement Learning with Wasserstein-Tilted Flow Maps*
([arXiv:2609.27033](https://arxiv.org/abs/2609.27033)). Plain HTML/CSS/JS, no build step.

## Preview locally

```bash
cd WTF_webpage && python3 -m http.server 8000
# open http://localhost:8000
```

Design options for review: open `http://localhost:8000/?options` for a picker (bottom right) that switches
between **Violet** (default), **Ember** and **Night**. `?theme=ember` / `?theme=night` also work directly.
The picker never shows without `?options`.

## Deploy on GitHub Pages

1. In the `wasserstein-tilted-flow-maps` organization, create a repo named `wasserstein-tilted-flow-maps.github.io`
   (served at https://wasserstein-tilted-flow-maps.github.io/).
2. Copy the *contents* of this folder to the repo root and push.
3. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.

## Layout

```
index.html              page
styles.css              design system + three themes
assets/js/main.js       results tables (data transcribed from the paper), tabs, BibTeX copy, lightbox, nav
assets/js/tilt-lab.js   interactive 1-D Wasserstein vs. KL tilt (exact port of the paper's synthetic experiment;
                        matches Table 16 at λ = 7)
assets/img/             figures exported from the paper; social.jpg is the 1200×630 link-preview card
```
