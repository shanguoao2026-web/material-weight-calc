# material-weight-calc

A TypeScript Node CLI for estimating common metal stock weight and cost for quotes and bills of materials. Zero runtime dependencies. Requires Node.js 18 or later.

## Install and run

```sh
npm install
npm run build
node dist/cli.js --shape round --d 50 --length 1000 --material steel
# Optionally install the command locally:
npm link
material-weight-calc --help
```

All dimensions and length are in **mm**. Density is in **g/cm³**. Quantity defaults to 1 and must be a positive integer. Supply a material or a custom density; `--density` overrides the selected material. All numeric inputs must be positive and finite.

| Shape | Required dimensions | Cross-section area |
| --- | --- | --- |
| round | `--d` diameter | πd²/4 |
| tube | `--od` outside diameter, `--wall` | π × wall × (od − wall) |
| plate | `--w` width, `--t` thickness | w × t |
| square | `--a` side | a² |
| hex | `--af` across flats | √3 × af²/2 |
| angle | `--a` leg, `--b` leg, `--t` thickness | t × (a + b − t) |

Tube wall must be less than half the outside diameter. Angle thickness must be less than both legs. Use identical `a` and `b` for an equal angle. Fillet radii are ignored.

| Material | Density (g/cm³) |
| --- | ---: |
| steel | 7.85 |
| stainless | 7.93 |
| aluminum | 2.70 |
| brass | 8.50 |
| copper | 8.96 |
| cast-iron | 7.20 |

## Examples

```sh
node dist/cli.js --shape tube --od 60 --wall 5 --length 1000 --material steel
node dist/cli.js --shape plate --w 500 --t 10 --length 1000 --material steel --qty 4 --price 2.50
node dist/cli.js --shape round --d 50 --length 1000 --material aluminum --qty 3 --json
node dist/cli.js --shape angle --a 50 --b 30 --t 5 --length 600 --density 7.85
```

Default output is a table rounded to two decimal places. `--json` emits unrounded numeric fields: `areaMm2`, `volumeCm3`, `unitMassKg`, `totalMassKg`, and optional `cost`. Area, volume, and unit mass describe one piece; total mass and cost include quantity. Price is per kg in your chosen currency, and cost uses that currency. Invalid arguments produce an error on stderr and exit status 1.

Volume (cm³) = area (mm²) × length (mm) / 1000. Unit mass (kg) = volume (cm³) × density (g/cm³) / 1000. These are nominal estimates; actual stock dimensions and alloy densities vary.

## JavaScript API

```js
import { calculate } from 'material-weight-calc';
const result = calculate({
  shape: 'round', d: 50, length: 1000, material: 'steel', qty: 2,
});
console.log(result.totalMassKg);
```

## Development

```sh
npm install
npm test
```

`npm test` builds TypeScript and runs the `node:test` suite, including CLI entry-point checks.

MIT licensed; see [LICENSE](LICENSE).
