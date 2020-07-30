/**
 * Helper function to execute comparators
 *
 * @param o1 An instance of {@code T}
 * @param o2 An instance of {@code T}
 * @param compareProp the prop from {@code T} to compare on. If undefined, then compare on
 *                    o1 and o2
 * @param compare the {@link CompareFn} to execute
 *
 * @private
 */
import { CompareWithProp, ComparatorBuilder, Comparator, CompareFn, NaturalOrder, isComparator } from './comparator'

const _compareKeyValue = <T>(o1: T, o2: T, { compareProp, compare }: CompareWithProp<T>): number => {
  if (compareProp === undefined) {
    const next = compare(o1, o2)
    return next
  } else {
    const o1Element = o1[compareProp]
    const o2Element = o2[compareProp]
    const next = compare(o1Element, o2Element)
    return next
  }
}

/**
 * Function that generates fluent, chainable, comparators for a type {@link T}.
 *
 * @example
 * const testOne = {
 *           foo: 'a string',
 *           bar: 1,
 *           baz: 'apple'
 *         }
 * const testTwo = {
 *           foo: 'b string',
 *           bar: 3,
 *           baz: 'apple'
 *         }
 * const comparatorValue = comparatorBuilder<typeof testOne>()
 *    .foo()
 *    .baz((o1, o2) => {
 *           if (o1 === o2) {
 *             return 0
 *           }
 *           return -1
 *         })
 *    .bar(((o1, o2) => o1 - o2))
 *    .compare(testOne, testTwo)
 *
 * @constructor
 */
export function comparatorBuilder<T>(): ComparatorBuilder<T> {
  const target = {} as ComparatorBuilder<T>
  const comparatorChain: CompareWithProp<T>[] = []
  const builder: ComparatorBuilder<T> = new Proxy<ComparatorBuilder<T>>(
    target,
    {
      get: (_, prop: keyof T) => {
        switch (prop) {
          case 'getComparatorChain':
            return () => comparatorChain
          case 'compare':
            return (o1: T, o2: T) => {

              if (comparatorChain.length < 1) {
                return 0
              }

              const [first, ...rest] = comparatorChain
              let initial = _compareKeyValue(o1, o2, first)

              for (const val of rest) {
                if (initial != 0) { // not equal
                  return initial
                } else { // o1 and o2 are equal, check next comparison
                  initial = _compareKeyValue(o1, o2, val)
                }
              }

              return initial
            }
          case 'reversed':
            return () => ({
              compare: (o1: T, o2: T): number => {
                return builder.compare(o2, o1)
              }
            })
          case 'thenComparing':
            return (comparator: Comparator<T>): ComparatorBuilder<T> => {
              comparatorChain.push({
                compareProp: undefined,
                compare: comparator.compare
              })
              return builder
            }
          default:
            return (x: Comparator<Partial<T>> | CompareFn<Partial<T>> | undefined): ComparatorBuilder<T> => {

              comparatorChain.push({
                compareProp: prop,
                compare: (o1, o2): number => {
                  if (!x) {
                    return NaturalOrder(o1, o2)
                  } else if (typeof x === 'function') {
                    return x(o1, o2)
                  } else if (isComparator(x)) {
                    return x.compare(o1, o2)
                  }
                  throw new Error(`Unknown compare operation ${JSON.stringify(x)}`)
                }
              })

              return builder
            }
        }
      },
    })

  return builder
}
