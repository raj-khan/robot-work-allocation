type Step<In, Out> = (input: In) => Out;

// Passes a value through each step left to right; overloads keep every step typed.
export function pipe<A>(value: A): A;
export function pipe<A, B>(value: A, s1: Step<A, B>): B;
export function pipe<A, B, C>(value: A, s1: Step<A, B>, s2: Step<B, C>): C;
export function pipe<A, B, C, D>(value: A, s1: Step<A, B>, s2: Step<B, C>, s3: Step<C, D>): D;
export function pipe<A, B, C, D, E>(
  value: A,
  s1: Step<A, B>,
  s2: Step<B, C>,
  s3: Step<C, D>,
  s4: Step<D, E>,
): E;
export function pipe<A, B, C, D, E, F>(
  value: A,
  s1: Step<A, B>,
  s2: Step<B, C>,
  s3: Step<C, D>,
  s4: Step<D, E>,
  s5: Step<E, F>,
): F;
export function pipe(value: unknown, ...steps: Step<unknown, unknown>[]): unknown {
  return steps.reduce((acc, step) => step(acc), value);
}
