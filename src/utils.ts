import { Comparable } from './comparator';

/**
 * Get keys with an optional filter type to filter the keys by and a flag to
 * include optional properties.
 */
const _isNumber = new RegExp(/^-?\d+\.?\d*$/);

const _containsOnlyNumbers = (s: string): boolean => {
  return !_isNumber.test(s);
};

export type KeysOf<
  T,
  U = unknown,
  REQUIRED extends boolean = true
> = REQUIRED extends true ? _KeysOf<Required<T>, U> : _KeysOf<T, U>;

/**
 * Get all of the properties from a type T whose types match U
 */
type _KeysOf<T, U = unknown> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Simple Function type
 */
export type Fn<P extends Params = unknown[], R = unknown> = (...args: P) => R;

/**
 * Simple async function type
 */
export type AsyncFunction<
  P extends Params = unknown[],
  R = PromiseLike<unknown>
> = (...args: P) => R;

/**
 * Get the result of an arbitrarily nested {@link Promise}. This is needed until
 * issue <a>https://github.com/microsoft/TypeScript/issues/27711</a> is resolved.
 */
export type UnwrapPromise<T = unknown> = {
  0: T;
  1: UnwrapPromise<_UnwrapPromise<T>>;
}[T extends PromiseLike<infer R>
  ? _IsPromise<R> extends false
    ? 0
    : 1
  : never];

/**
 * Extract the return type of
 */
export type Promisify<T extends Fn> = Promise<UnwrapPromise<ReturnType<T>>>;

/**
 * If {@code P} is a {@link Promise} return type === {@code true} otherwise type === {@code false}
 * @private
 */
type _IsPromise<P, T = true, F = false> = P extends PromiseLike<unknown>
  ? T
  : F;

/**
 * Unbox the generic type of a {@link Promise}. If {@code P} is not a {@link Promise}, return {@code P}
 * @private
 */
type _UnwrapPromise<P> = P extends PromiseLike<infer R> ? R : P;

/**
 * Params type
 * @private
 */
type Params<A = unknown> = ReadonlyArray<A>;

/**
 * Unbox a the type of an array
 */
export type Unbox<T extends Array<unknown>> = T extends Array<infer C>
  ? C
  : never;

/**
 * Interface for items that can be ordered
 */
export interface Ordered {
  order: number;
}

/**
 * T or {@code undefined}. This name is not ideal.
 */
export type Optional<T> = T | undefined;

/**
 * {@code T} or {@code null} type.
 */
export type Nullable<T> = T | null;

/**
 * General types that are Orderable
 */
export type Orderable<T> = T extends Comparable<infer C> ? C : T;

/**
 * Validation rule for {@code T}
 */
export type Rule<T> = (subject: T) => boolean;

/**
 * Interface for Validation builder
 */
export interface ValidatorBuilder<T> {
  addRule: (rule: Rule<T>) => ValidatorBuilder<T>;
  validate(target: T): boolean;
}

/**
 * Fold a collection of functions from left to right, piping the output of
 * one into the input of the next.
 *
 * @param funcs the functions to pipe.
 */
export const pipeAsync = <T extends Fn, P extends Parameters<T>>(
  funcs: T[],
) => async (...args: P): Promisify<T> => {
  const result: Promisify<T> | undefined = undefined;
  for (const func of funcs) {
    try {
      (result as Promisify<T> | unknown) = await func(...args);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  return result as Promisify<T>;
};

/**
 * Compare {@link Ordered}s in descending order.
 *
 * @param a A {@link Ordered}
 * @param b A {@link Ordered}
 */
export const lowestPrecedence = (a: Ordered, b: Ordered): number =>
  a.order - b.order;

/**
 * Get all of named the keys of unknown object in a typesafe way. Useful for iterating over the
 * objects with typed keys like enums.
 *
 * @param o the object to get the keys from.
 */
export const keysOf = <K extends Record<string, unknown>>(o: K): (keyof K)[] =>
  Object.keys(o).filter(_containsOnlyNumbers) as (keyof K)[];

/**
 * Case insensitive string compare.
 *
 * @param a the first string
 * @param b the second string
 */
export const caseInsensitiveCompare = (a: string, b: string): boolean =>
  a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;

/**
 * Type guard function for {@code null} and {@undefined}. Pass this to a filter function for a (V | null | undefined)[]
 * to get a V[].
 *
 * @param value the value
 */
export const isDefined = <V>(value: V | null | undefined): value is V => {
  return value !== null && value !== undefined;
};

/**
 * Given an {@link Iterable} search via a given predicate function and return the first found
 * item or {@code undefined}
 *
 * @param iterable the {@link Iterable}
 * @param predicate the predicate function
 */
export function find<T>(
  iterable: Iterable<T>,
  predicate: (arg: T) => boolean,
): Optional<T> {
  for (const t of iterable) {
    if (predicate(t)) {
      return t;
    }
  }
  return undefined;
}

/**
 * Lazily apply a function to an {@link Iterable}. Useful in combination with functions like {@link find}
 * when you want to apply a transformation and filter a large collection, but don't want to eagerly map
 * over the whole collection first.
 *
 * @param iterable The {@link Iterable}
 * @param fn a transformation function
 */
export function* mapLazy<T, R = T>(
  iterable: Iterable<T>,
  fn: (arg: T) => R,
): Generator<R> {
  for (const t of iterable) {
    yield fn(t);
  }
}

/**
 * Returns {@code true} if the two specified collections have <em>no</em> elements in common.
 * @param c1 the c1 collection
 * @param c2 the c2 collection
 * @param matcher optional function to control comparison of elements from c1 and c2.
 */
export const isDisjoint = <T extends unknown[], C = Unbox<T>>(
  c1: T,
  c2: T,
  matcher: (f: C, s: C) => boolean = Object.is,
): boolean => {
  return (
    c1.find((c1Elem) =>
      c2.some((c2Elem) => matcher(c1Elem as C, c2Elem as C)),
    ) === undefined
  );
};

/**
 * Returns {@code true} if every element of c1 is also an element of c2
 * @param c1 the c1 collection
 * @param c2 the c2 collection
 * @param matcher optional function to control comparison of elements from c1 and c2.
 */
export const isSubset = <T extends unknown[], C = Unbox<T>>(
  c1: T,
  c2: T,
  matcher: (f: C, s: C) => boolean = Object.is,
): boolean => {
  return c1.every((c1Elem) =>
    c2.some((c2Elem) => matcher(c1Elem as C, c2Elem as C)),
  );
};

/**
 * Guard function to check if a value is empty
 * @param value the, possibly undefined, array of {@code T}
 */
export const isEmpty = <T extends string | Record<string, unknown> | unknown[]>(
  value: Optional<T> | null,
): value is never => {
  if (value == null) {
    return true;
  }
  if (isString(value) || Array.isArray(value)) {
    return value.length === 0;
  }

  return Object.keys(value).length === 0;
};

/**
 * Guard function to check if a value is a {@code string}
 * @param s the value to check.
 */
const isString = (s: unknown): s is string => {
  return typeof s === 'string';
};
