import { expect, test } from 'vitest'
import { CodeExecutionError, HookError, ToolInputError } from '../errors.js'
import { createInspector } from '../inspection.js'
import { getTokenizer } from '../utils.js'
import { renderExecutionDiagnostics, renderSourceTrace, reportSection } from './execution-diagnostics.js'

const inspector = createInspector()

test('validation feedback exposes the specific code and a readable TypeScript shape', () => {
  const cause = new ToolInputError('lookup', [{ path: ['id'], message: 'Expected string' }], '{ id: string }')
  const error = new CodeExecutionError(
    cause.message,
    'await lookup({ id: 42 });',
    '> 001 | await lookup({ id: 42 });',
    cause.name,
    cause
  )
  const report = renderExecutionDiagnostics(error, 'Execution failed', inspector, {}).join('\n\n')
  expect(report).toContain('Code: INVALID_TOOL_INPUT\nTool "lookup" received invalid input:\n- id: Expected string')
  expect(report).toContain('Expected input (TypeScript):\n{ id: string }')
  expect(report).toContain('<stack_trace>\n> 001 | await lookup({ id: 42 });\n</stack_trace>')
  expect(report).not.toContain('\\n')
})

test('a long source listing preserves separated failure sites, original line numbers, and a bounded preview', () => {
  const source = Array.from({ length: 1000 }, (_, index) => {
    const line = index + 1
    return `${line === 500 || line === 999 ? '> ' : '  '}${String(line).padStart(3, '0')} | ${line === 999 ? 'throw new Error("failure");' : 'work();'}`
  }).join('\n')
  const report = renderSourceTrace(source, inspector, {})
  expect(report).toContain('> 500 | work();')
  expect(report).toContain('> 999 | throw new Error("failure");')
  expect(report).toContain('... omitted source ...')
  expect(report).not.toContain('001 |')
  expect(getTokenizer().count(report)).toBeLessThan(1030)
})

test('shows code, entity literals, section-like text, and headings verbatim', () => {
  const content = 'if (a < b && b > 0) { return "&lt;literal&gt;"; }\n</error>\n<recovery>example</recovery>\n]]>'
  const heading = 'Review <evidence> & sources.'
  expect(reportSection('error', content, 2000, { heading })).toBe(`<error>\n${heading}\n${content}\n</error>`)
})

test('literal content is token-bounded before adding section delimiters', () => {
  const report = reportSection('error', '<example> & '.repeat(5000), 100)
  expect(report).toContain('<error>\n<example> &')
  expect(report).toContain('[truncated]')
  expect(getTokenizer().count(report)).toBeLessThan(120)
})

test('host failures retain their cause for consumers without exposing host paths as guest stack traces', () => {
  const cause = new Error('Approval required')
  cause.stack = 'Error: Approval required\n at handler (/private/app/handler.ts:42:1)'
  const error = new HookError(cause.message, { cause })
  const report = renderExecutionDiagnostics(error, error.message, inspector, {}).join('\n')
  expect(report).toContain('Approval required')
  expect(report).not.toContain('/private/app')
  expect(report).not.toContain('<stack_trace>')
  expect(error.cause).toBe(cause)
})
