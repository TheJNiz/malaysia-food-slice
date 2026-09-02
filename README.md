# Malaysia Food Slice

A lightweight Vue 3 + Phaser web game inspired by swipe-to-slice arcade gameplay.

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

## Next art upgrade

Replace the current emoji placeholders with transparent PNG/WebP food artwork.

Recommended assets:

```text
public/assets/food/
  nasi-lemak.png
  nasi-lemak-left.png
  nasi-lemak-right.png
  curry-puff.png
  curry-puff-left.png
  curry-puff-right.png
  fried-chicken.png
  fried-chicken-left.png
  fried-chicken-right.png
  roti-canai.png
  roti-canai-left.png
  roti-canai-right.png
  bao.png
  bao-left.png
  bao-right.png
```

For the nasi lemak art, use the classic Malaysian triangular banana-leaf/paper packet rather than a rice-ball graphic.
