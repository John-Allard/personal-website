# John B. Allard

Personal website: research, publications, and scientific software.

## Development

Run `npm run dev` and open http://127.0.0.1:4173. The website uses plain HTML, CSS, and JavaScript with no runtime dependencies.

`npm run build` copies the website to `dist/`. GitHub Actions publishes that directory to GitHub Pages on pushes to `main`.

## Files

- `index.html`: page content and links.
- `styles.css`: responsive layout and print styles.
- `script.js`: navigation and video playback, including reduced-motion support.
- `assets/`: portrait, software figures, and tree animation.
- `scripts/`: local preview, build, and offline rendering utilities.

## Figures

The eukaryotic tree animation was rendered in [Big Tree Viewer](https://bigtreeviewer.net/) from a session containing 484,771 tips. It starts at humans and zooms out to the full tree, with fixed branch colors and transitions between taxonomy ribbon ranks. The source session is not included here. Render settings are in `scripts/eukaryota-render-metadata.json`.

The ESL-PSC Toolkit image is Figure 1 from the [author manuscript](https://kumarlab.net/downloads/papers/AllardKumar2026.pdf) of the [published paper](https://doi.org/10.1093/molbev/msag205). The Treemble screenshot is from the [project documentation](https://treemble.org/).

## Rendering the animation

Offline rendering requires a Big Tree Viewer development checkout with Playwright installed, Chrome, and FFmpeg. Set `BTV_REPO` to the checkout, `BTV_URL` to its running development server, and `BTV_SESSION` to the session file. Optionally set `CHROME_PATH`. Run `node scripts/render-eukaryota.mjs`; add `--preview` for still images only. These tools are not required to build or serve the website.

The video is 1920×1080, 24 fps, and 22 seconds long. The lower-right credit uses `scripts/video-watermark.png`.
