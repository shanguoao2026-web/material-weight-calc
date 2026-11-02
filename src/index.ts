/** Material densities in g/cm³. */
export const materials = {
  steel: 7.85,
  stainless: 7.93,
  aluminum: 2.70,
  brass: 8.50,
  copper: 8.96,
  'cast-iron': 7.20,
} as const;

export type Shape = 'round' | 'tube' | 'plate' | 'square' | 'hex' | 'angle';
export interface Options {
  shape: Shape;
  material?: keyof typeof materials;
  density?: number;
  length: number;
  qty?: number;
  price?: number;
  d?: number;
  od?: number;
  wall?: number;
  w?: number;
  t?: number;
  a?: number;
  b?: number;
  af?: number;
}
export interface Result {
  areaMm2: number;
  volumeCm3: number;
  unitMassKg: number;
  totalMassKg: number;
  cost?: number;
}

function positive(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number`);
  }
  return value;
}

/** Calculate one piece's area, volume and mass, then multiply mass by quantity. */
export function calculate(options: Options): Result {
  const length = positive(options.length, 'length');
  const qty = positive(options.qty ?? 1, 'qty');
  if (!Number.isSafeInteger(qty)) throw new Error('qty must be a positive safe integer');
  if (options.material !== undefined && !Object.hasOwn(materials, options.material)) {
    throw new Error(`Unknown material: ${options.material}`);
  }
  const density = positive(options.density ?? (options.material ? materials[options.material] : undefined), 'density (or a material)');
  const dim = (name: 'd' | 'od' | 'wall' | 'w' | 't' | 'a' | 'b' | 'af') => positive(options[name], name);
  let area: number;
  switch (options.shape) {
    case 'round': area = Math.PI * dim('d') ** 2 / 4; break;
    case 'tube': {
      const od = dim('od'), wall = dim('wall');
      if (wall >= od / 2) throw new Error('tube wall must be less than od/2');
      area = Math.PI * wall * (od - wall);
      break;
    }
    case 'plate': area = dim('w') * dim('t'); break;
    case 'square': area = dim('a') ** 2; break;
    case 'hex': area = Math.sqrt(3) * dim('af') ** 2 / 2; break;
    case 'angle': {
      const a = dim('a'), b = dim('b'), t = dim('t');
      if (t >= a || t >= b) throw new Error('angle t must be less than a and b');
      area = t * (a + b - t);
      break;
    }
    default: throw new Error(`Unknown shape: ${options.shape}`);
  }
  const volumeCm3 = area * length / 1000;
  const unitMassKg = volumeCm3 * density / 1000;
  const result: Result = { areaMm2: area, volumeCm3, unitMassKg, totalMassKg: unitMassKg * qty };
  if (options.price !== undefined) result.cost = result.totalMassKg * positive(options.price, 'price');
  if (Object.values(result).some(value => !Number.isFinite(value) || value <= 0)) {
    throw new Error('Calculated result is outside the supported numeric range');
  }
  return result;
}
