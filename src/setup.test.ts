import { expect } from 'vitest'
import { Project, Diagnostic } from 'ts-morph'
import { format } from 'prettier'

export function isValidTypescript(
  code: string,
): { isValid: true } | { isValid: false; diagnostics: Diagnostic[]; errorMessage: string } {
  const project = new Project({})
  try {
    project.createSourceFile('test.ts', code)
    const diags = project.getPreEmitDiagnostics()
    if (diags.length) {
      return { isValid: false, diagnostics: diags, errorMessage: project.formatDiagnosticsWithColorAndContext(diags) }
    }
    return { isValid: true }
  } catch (e: any) {
    return { isValid: false, diagnostics: [], errorMessage: e?.message || '' }
  }
}

expect.extend({
  toBeValidTypeScript(received: string) {
    const { isNot } = this
    const validation = isValidTypescript(received)

    return {
      pass: validation.isValid,
      message: () => {
        return `Expected code to ${isNot ? 'not ' : ''}be valid TypeScript:\n${received}\n\n${validation.isValid ? '' : validation.errorMessage}`
      },
    }
  },
})

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
