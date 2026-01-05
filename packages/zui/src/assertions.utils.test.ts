import { expect } from 'vitest'
import { format } from 'prettier'

const formatTs = async (code: string): Promise<string> => {
  code = code.replace(/\s+/g, ' ')
  code = await format(code, { parser: 'typescript' })
  return code
}

export const assert = (received: string) => ({
  not: {
    async toMatchWithoutFormatting(expected: string) {
      const transformedReceived = await formatTs(received)
      const transformedExpected = await formatTs(expected)
      expect(transformedReceived).not.toBe(transformedExpected)
    },
  },

  async toMatchWithoutFormatting(expected: string) {
    const transformedReceived = await formatTs(received)
    const transformedExpected = await formatTs(expected)
    expect(transformedReceived).toBe(transformedExpected)
  },
})
