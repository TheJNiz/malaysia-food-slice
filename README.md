# Malaysia Food Slice

A lightweight Vue 3 + Phaser web game inspired by swipe-to-slice arcade gameplay.

Play it at [the GitHub Pages site](https://thejniz.github.io/malaysia-food-slice/).

## Foods included

- Nasi lemak
- Curry puff
- Fried chicken
- Roti canai
- Bao

## Gameplay

- Swipe / mouse-drag across food to slice it.
- Each food gives points.
- Slice multiple foods quickly for combo bonuses.
- Miss 3 foods and the game ends.
- Slice a bomb and the game ends immediately.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in your terminal.

## Production build

```bash
npm run build
```

The deployable files will be created in `dist/`.

Pushes to `main` are automatically built and deployed to GitHub Pages.

## Artwork

The food uses original transparent PNG game sprites stored in `public/assets/food/`.
The Foodtale logo is stored in `public/assets/branding/` and the interface uses the logo's red-and-white palette.
