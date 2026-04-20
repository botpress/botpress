import { expect } from 'vitest'
import { format } from 'prettier'

const _formatTs = async (code: string): Promise<string> => {
  code = code.replace(/\s+/g, ' ')
  code = await format(code, { parser: 'typescript' })
  return code
}

export const assertIs = <T>(_arg: T): void => {}

export type IsEqual<T, U> = (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2 ? true : false
export const assertEqual = <A, B>(val: IsEqual<A, B>) => val

export const expectTypescript = (received: string) => ({
  not: {
    async toMatchWithoutFormatting(expected: string) {
      const transformedReceived = await _formatTs(received)
      const transformedExpected = await _formatTs(expected)
      expect(transformedReceived).not.toBe(transformedExpected)
    },
  },

  async toMatchWithoutFormatting(expected: string) {
    const transformedReceived = await _formatTs(received)
    const transformedExpected = await _formatTs(expected)
    expect(transformedReceived).toBe(transformedExpected)
  },
})
