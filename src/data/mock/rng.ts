export class SeededRNG {
  private state: number;

  constructor(seed = 123456789) {
    this.state = seed;
  }

  // Returns float in [0, 1)
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }

  // Returns float in [min, max)
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Returns integer in [min, max]
  intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // Normal distribution around mean with standard deviation
  gaussian(mean = 0, stdev = 1): number {
    let u = 0, v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stdev;
  }
}

export const globalRNG = new SeededRNG(424242);
