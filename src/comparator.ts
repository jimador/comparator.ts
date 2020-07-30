/**
 * Comparator interface
 */
import { Orderable } from './utils';

export type Comparator<T> = {
  /**
   * Compares its two arguments for order.  Returns a negative integer,
   * zero, or a positive integer as the first argument is less than, equal
   * to, or greater than the second.
   * @param o1 the first object to be compared.
   * @param o2 the second object to be compared.
   * @return a negative integer, zero, or a positive integer as the
   *         first argument is less than, equal to, or greater than the
   *         second.
   */
  compare(o1: T, o2: T): number;
};

/**
 * Comparable interface
 */
export type Comparable<T extends Comparable<T>> = {
  /**
   * Compares this object with the specified object for order.  Returns a
   * negative integer, zero, or a positive integer as this object is less
   * than, equal to, or greater than the specified object.
   * @param other an instance of {@code T} to compare
   */
  compareTo(other: T): number;
};

/**
 * Function type for {@link Comparable#compareTo}
 */
export type CompareToFn<T extends Comparable<T>> = (other: T) => number;

/**
 * Function type for {@link Comparator#compare}
 */
export type CompareFn<T> = (o1: T, o2: T) => number;

/**
 * Guard function for {@link Comparable}
 * @param o the item to test.
 */
export function isComparable<T extends Comparable<T>>(
  o: unknown,
): o is Comparable<T> {
  return o && typeof o === 'object' && (o as Comparable<T>).compareTo !== null;
}

/**
 * Guard function for {@link Comparable}
 * @param o the item to test.
 */
export function isComparator<T extends Comparator<T>>(
  o: unknown,
): o is Comparator<T> {
  return o && typeof o === 'object' && (o as Comparator<T>).compare != null;
}

/**
 * Simple natural order {@link CompareFn}.
 *
 * @param o1 the first {@code T} to compare
 * @param o2 the second {@code T} to compare
 * @constructor
 */
export const NaturalOrder: CompareFn<Orderable<unknown>> = <T>(
  o1: Orderable<T>,
  o2: Orderable<T>,
): number => {
  // simple cases
  if (o1 == o2) {
    return 0;
  }
  if (o1 == null) {
    return -1;
  }
  if (o2 == null) {
    return 1;
  }

  // if comparable then do that
  if (isComparable(o1) && isComparable(o2)) {
    return o1.compareTo(o2);
  }

  // localeCompare for strings
  if (typeof o1 === 'string' && typeof o2 === 'string') {
    return o1.localeCompare(o2, 'standard', { sensitivity: 'case' });
  }

  // o2 & o1 are just primitives
  return o2 > o1 ? -1 : 1;
};

/**
 * Reverse {@link NaturalOrder} function
 * @param o1 the first {@code T} to compare
 * @param o2 the second {@code T} to compare
 * @constructor
 */
export const ReverseNaturalOrder = <T extends Orderable<unknown>>(
  o1: T,
  o2: T,
): number => {
  return NaturalOrder(o2, o1);
};

/**
 * Type wrapping a possible prop and a compare function for that prop.
 * The absence of a prop is generally taken to mean that the compare
 * function should be applied to the top level object.
 */
export type CompareWithProp<T> = {
  compareProp?: keyof T;
  compare(o1: Partial<T>, o2: Partial<T>): number;
};

/**
 * Extending {@link Comparator} with more functionality.
 */
export interface FluentComparator<T> extends Comparator<T> {
  reversed(): Comparator<T>;

  thenComparing(comparator: Comparator<T>): ComparatorBuilder<T>;
}

/**
 * Function for proxying a property {@code K} of a type {@code T}.
 */
export type FieldComparisonBuilderGenerator<T, K extends keyof T> = (
  arg?: CompareFn<T[K]> | Comparator<T[K]>,
) => ComparatorBuilder<T>;

/**
 * Proxy for a type {@code T} that wraps each field in a {@link FieldComparisonBuilderGenerator}
 */
export type ComparatorBuilderProxy<T> = {
  [K in keyof T]: FieldComparisonBuilderGenerator<T, K>;
};

/**
 * Comparator builder type definition
 */
export type ComparatorBuilder<T> = FluentComparator<T> &
  ComparatorBuilderProxy<T> & { getComparatorChain(): CompareWithProp<T>[] };
