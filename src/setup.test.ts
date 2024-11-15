import { expect } from 'vitest'
import { format } from 'prettier'

const formatTs = async (code: string): Promise<string> => {
  code = code.replace(/\s+/g, ' ')
  code = await format(code, { parser: 'typescript' })
  return code
}

expect.extend({
  async toMatchWithoutFormatting(received: string, expected: string, _) {
    const { isNot } = this
    const transformedReceived = await formatTs(received)
    const transformedExpected = await formatTs(expected)

    return {
      pass: transformedExpected === transformedReceived,
      message: () => {
        const message = isNot ? 'not ' : ''
        const diffView = this.utils.diff(transformedExpected, transformedReceived, { expand: true })
        return `Expected output to ${message}match without formatting:\n${diffView}`
      },
    }
  },
})
