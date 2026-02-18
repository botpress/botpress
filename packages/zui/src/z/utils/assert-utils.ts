import { IsEqual } from './type-utils'

export type AssertNever<_T extends never> = true
export type AssertTrue<_T extends true> = true

export const assertEqual = <A, B>(val: IsEqual<A, B>) => val
export function assertIs<T>(_arg: T): void {}
export function assertNever(_x: never): never {
  throw new Error('assertNever called')
}
