#!/usr/bin/env node
import { calculate, type Options } from './index.js';
import { pathToFileURL } from 'node:url';

const help = `Usage: material-weight-calc --shape SHAPE --length MM (--material NAME | --density G/CM3) [options]

Shapes and required dimensions (all in mm):
  round   --d DIAMETER
  tube    --od OUTSIDE_DIAMETER --wall THICKNESS
  plate   --w WIDTH --t THICKNESS
  square  --a SIDE
  hex     --af ACROSS_FLATS
  angle   --a LEG --b LEG --t THICKNESS (ignores fillets)

Materials: steel, stainless, aluminum, brass, copper, cast-iron
Options:
  --density NUMBER  Override material density in g/cm³
  --qty INTEGER     Number of pieces (default 1)
  --price NUMBER    Price per kg; adds total cost
  --json            Output unrounded JSON values
  --help, -h        Show this help

Example:
  material-weight-calc --shape round --d 50 --length 1000 --material steel
`;

const numeric = new Set(['length', 'density', 'qty', 'price', 'd', 'od', 'wall', 'w', 't', 'a', 'b', 'af']);
const allowed = new Set(['shape', 'material', ...numeric]);
export function run(args: string[], stdout: (text: string) => void, stderr: (text: string) => void): number {
try {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    stdout(help);
  } else {
    const values: Record<string, string | number> = {};
    let json = false;
    const seen = new Set<string>();
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (seen.has(arg)) throw new Error(`Duplicate option: ${arg}`);
      seen.add(arg);
      if (arg === '--json') { json = true; continue; }
      const key = arg.startsWith('--') ? arg.slice(2) : '';
      if (!allowed.has(key)) throw new Error(`Unknown option: ${arg}`);
      const value = args[++i];
      if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      if (numeric.has(key)) {
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
          throw new Error(`${arg} must be a number`);
        }
        values[key] = Number(value);
      } else values[key] = value;
    }
    const result = calculate(values as unknown as Options);
    if (json) stdout(JSON.stringify(result, null, 2) + '\n');
    else {
      const rows: [string, number][] = [
        ['Cross-section area (mm²)', result.areaMm2],
        ['Unit volume (cm³)', result.volumeCm3],
        ['Unit mass (kg)', result.unitMassKg],
        ['Total mass (kg)', result.totalMassKg],
      ];
      if (result.cost !== undefined) rows.push(['Total cost', result.cost]);
      stdout(rows.map(([label, value]) => `${label.padEnd(26)} | ${value.toFixed(2)}`).join('\n') + '\n');
    }
  }
} catch (error) {
  stderr(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
  return 1;
}

return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = run(process.argv.slice(2), text => process.stdout.write(text), text => process.stderr.write(text));
}
