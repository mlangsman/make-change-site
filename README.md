# Make Change site

Portfolio site built with [Astro](https://astro.build) from the Figma file **Creative Portfolio**, frame *Desktop - 5* (node `34:298`).

```bash
npm install
npm run dev
```

## Structure

- `src/pages/index.astro`: the home page. Layout values come from the Figma frame.
- `src/components/ProjectCard.astro`: project card (Figma node `34:316`).
- `src/components/Aura.astro` and `src/scripts/aura.ts`: the Aura background, a WebGL gradient with film grain. It renders at half resolution, follows the cursor, tints plum around a hovered card (`data-aura-focus`), and shows a still frame for `prefers-reduced-motion`. Its colours are the `--aura-*` tokens in `src/styles/global.css`.
- `public/fonts`: PP Eiko (Medium, Thin) and PP Neue Montreal (Regular, Light, Text Book), converted to WOFF2.
- `public/images`: the logo and The Optimist wordmark exported from Figma, plus the grain tile.
- `.figma-ref`: the original Figma exports, kept for reference. They are not served.

## Notes

- **Font licence:** these are Pangram Pangram's *Free for Personal Use* versions (EULA in `.figma-ref`). Buy web licences for PP Eiko and PP Neue Montreal before the site goes public.
- **Logo:** in Figma the logo is a crop of a larger image and has a light background tile behind it. `public/images/logo.png` is the same export with that tile made transparent, so the Aura background shows through.
