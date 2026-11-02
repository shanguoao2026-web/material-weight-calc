# material-weight-calc
TypeScript Node CLI (zero runtime deps, MIT, README in English) to estimate weight of common metal stock for quoting/BOM work.
- Shapes: --shape round (--d), tube (--od --wall), plate (--w --t), square (--a), hex (--af across flats), angle (--a --b --t equal/unequal L-angle, ignore fillet radii). All dims mm; --length mm; --qty (default 1).
- Materials via --material: steel 7.85, stainless 7.93, aluminum 2.70, brass 8.50, copper 8.96, cast-iron 7.20 g/cm3; or --density g/cm3 override.
- Optional --price per kg -> total cost.
- Output: cross-section area mm², volume cm³, unit mass kg, total mass kg, optional cost. Table and --json. Validate inputs (positive numbers, tube wall < od/2, angle t < a and b).
- Tests (node:test): steel round d50 L1000 -> 15.41 kg; steel plate 500x10 L1000 -> 39.25 kg; steel tube od60 wall5 L1000 -> area 863.94 mm², 6.78 kg; aluminum round d50 L1000 qty 3 -> ≈15.90 kg total; invalid wall errors.
- npm test must build and pass. .gitignore node_modules/ dist/ *.log. No secrets, no personal info.
