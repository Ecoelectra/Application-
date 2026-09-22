/** Exakte Bruchrechnung auf BigInt-Basis – vermeidet Rundungsfehler beim Ausgleichen. */
export class Fraction {
  readonly num: bigint;
  readonly den: bigint;

  constructor(num: bigint | number, den: bigint | number = 1n) {
    let n = typeof num === 'number' ? BigInt(Math.round(num)) : num;
    let d = typeof den === 'number' ? BigInt(Math.round(den)) : den;
    if (d === 0n) throw new Error('Division durch null');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(abs(n), d) || 1n;
    this.num = n / g;
    this.den = d / g;
  }

  static readonly ZERO = new Fraction(0n);
  static readonly ONE = new Fraction(1n);

  add(other: Fraction): Fraction {
    return new Fraction(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  sub(other: Fraction): Fraction {
    return new Fraction(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  mul(other: Fraction): Fraction {
    return new Fraction(this.num * other.num, this.den * other.den);
  }

  div(other: Fraction): Fraction {
    if (other.num === 0n) throw new Error('Division durch null');
    return new Fraction(this.num * other.den, this.den * other.num);
  }

  neg(): Fraction {
    return new Fraction(-this.num, this.den);
  }

  isZero(): boolean {
    return this.num === 0n;
  }

  isNegative(): boolean {
    return this.num < 0n;
  }

  valueOf(): number {
    return Number(this.num) / Number(this.den);
  }

  toString(): string {
    return this.den === 1n ? this.num.toString() : `${this.num}/${this.den}`;
  }
}

export function gcd(a: bigint, b: bigint): bigint {
  let x = abs(a);
  let y = abs(b);
  while (y) {
    [x, y] = [y, x % y];
  }
  return x;
}

export function lcm(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  return abs(a * b) / gcd(a, b);
}

export function abs(a: bigint): bigint {
  return a < 0n ? -a : a;
}

/** Skaliert einen Bruchvektor auf die kleinsten ganzzahligen Werte. */
export function toSmallestIntegers(vector: Fraction[]): bigint[] {
  const denominators = vector.map((f) => f.den);
  const commonDen = denominators.reduce((acc, d) => lcm(acc, d), 1n);
  const scaled = vector.map((f) => (f.num * commonDen) / f.den);
  const divisor = scaled.reduce((acc, v) => gcd(acc, v), 0n) || 1n;
  return scaled.map((v) => v / divisor);
}
