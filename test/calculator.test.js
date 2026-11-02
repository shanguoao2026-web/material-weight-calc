import test from 'node:test';
import assert from 'node:assert/strict';
import { run as runCli } from '../dist/cli.js';
import { calculate, materials } from '../dist/index.js';

const base = { material: 'steel', length: 1000 };
const near = (actual, expected, tolerance = 0.005) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);
test('required stock examples', () => {
  near(calculate({ ...base, shape: 'round', d: 50 }).unitMassKg, 15.41);
  near(calculate({ ...base, shape: 'plate', w: 500, t: 10 }).unitMassKg, 39.25);
  const tube = calculate({ ...base, shape: 'tube', od: 60, wall: 5 });
  near(tube.areaMm2, 863.94);
  near(tube.unitMassKg, 6.78);
  near(calculate({ ...base, material: 'aluminum', shape: 'round', d: 50, qty: 3 }).totalMassKg, 15.90);
});
test('square, hex and equal/unequal angles', () => {
  assert.equal(calculate({ ...base, shape: 'square', a: 10 }).areaMm2, 100);
  near(calculate({ ...base, shape: 'hex', af: 10 }).areaMm2, 86.60254);
  assert.equal(calculate({ ...base, shape: 'angle', a: 50, b: 50, t: 5 }).areaMm2, 475);
  assert.equal(calculate({ ...base, shape: 'angle', a: 50, b: 30, t: 5 }).areaMm2, 375);
});
test('density override, materials, quantity and cost', () => {
  for (const [material, density] of Object.entries(materials)) {
    near(calculate({ shape: 'square', a: 10, length: 1000, material }).unitMassKg, density / 10);
  }
  const result = calculate({ ...base, shape: 'square', a: 10, density: 10, qty: 3, price: 2 });
  assert.deepEqual(result, { areaMm2: 100, volumeCm3: 100, unitMassKg: 1, totalMassKg: 3, cost: 6 });
  assert.equal(calculate({ shape: 'square', a: 10, length: 1000, density: 10 }).unitMassKg, 1);
});
test('invalid geometry and numbers', () => {
  for (const wall of [0, -1, 30, 31, NaN, Infinity]) {
    assert.throws(() => calculate({ ...base, shape: 'tube', od: 60, wall }));
  }
  for (const t of [30, 50, 51]) assert.throws(() => calculate({ ...base, shape: 'angle', a: 50, b: 30, t }));
  for (const patch of [{ length: 0 }, { qty: 1.5 }, { qty: -2 }, { density: 0 }, { price: -1 }, { d: NaN }, { material: 'wood' }, { shape: 'unknown' }]) {
    assert.throws(() => calculate({ ...base, shape: 'round', d: 50, ...patch }));
  }
  assert.throws(() => calculate({ ...base, shape: 'round' }));
  assert.throws(() => calculate({ shape: 'round', d: 50, length: 1000 }));
});
const run = async (...args) => {
  let stdout = '', stderr = '';
  const status = runCli(args, text => stdout += text, text => stderr += text);
  return { status, stdout, stderr };
};
const cli = async (...args) => {
  const result = await run(...args);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
};
const args = ['--shape', 'round', '--d', '50', '--length', '1000', '--material', 'steel'];
test('CLI table, JSON, price and help', async () => {
  assert.match(await cli(...args), /Total mass \(kg\)\s+\| 15\.41/);
  const result = JSON.parse(await cli(...args, '--qty', '2', '--price', '3', '--json'));
  near(result.totalMassKg, 30.82688);
  assert.equal(result.cost, result.totalMassKg * 3);
  assert.match(await cli('--help'), /Usage:/);
  assert.match(await cli(), /Usage:/);
});
test('CLI failures go to stderr with nonzero status', async () => {
  for (const extra of [['--unknown'], ['--qty'], ['--qty', 'abc'], ['--qty', '0'], ['--json', '--json'], ['--length', '2']]) {
    const result = await run(...args, ...extra);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^Error:/);
    assert.equal(result.stdout, '');
  }
  const result = await run('--shape', 'tube', '--od', '60', '--wall', '30', '--length', '1000', '--material', 'steel');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /wall/);
});
