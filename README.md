# WTF?! project page

Project page for *WTF?! Simulation-Free Reinforcement Learning with Wasserstein-Tilted Flow Maps*
([arXiv:2609.27033](https://arxiv.org/abs/2609.27033)), served at https://wasserstein-tilted-flow-maps.github.io/.
Code: [wasserstein-tilted-flow-maps/WTF](https://github.com/wasserstein-tilted-flow-maps/WTF).
Checkpoints: [Hugging Face](https://huggingface.co/wasserstein-tilted-flow-maps/WTF).

Plain HTML, CSS and JavaScript, with no build step. To preview locally:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Layout

```
index.html              page
styles.css              styles
assets/js/main.js       results tables (transcribed from the paper), tabs, BibTeX copy, lightbox, nav
assets/js/tilt-lab.js   interactive 1-D Wasserstein vs. KL tilt (port of the paper's synthetic experiment)
assets/js/valuefig.js   value-estimation figure
assets/js/computefig.js reward vs. training compute figure
assets/js/qual.js       tilt animation and sample gallery
assets/                 images, video and figure data; img/social.jpg is the link-preview card
```
