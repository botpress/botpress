/**
 * @deprecated use x satisfies never instead
 */
export function assertNever(_x: never): never {
  throw new Error('assertNever called')
}
