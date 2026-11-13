import { describe, expect, it } from 'vitest'
import { inspect } from '../inspect.js'
import { DualModePrompt } from './dual-modes.js'
import { MAX_RESULT_CHARS, MAX_TOOL_CALL_FIELD_CHARS } from './result-budget.js'

const NOTICE = /\[truncated: showing (\d+) of (\d+) chars — return a smaller slice or filter to see the rest\]/
const RESULT_INSPECTION = { tokens: 100_000, maxStringLength: Infinity }

const html = (n: number) => `<html><body>${'<div class="row"><p>cell</p></div>\n'.repeat(n)}</body></html>`

const thinking = async (variables: unknown, isChatEnabled: boolean) =>
  String((await DualModePrompt.getThinkingMessage({ variables, isChatEnabled })).content)

describe.each([
  { mode: 'worker', isChatEnabled: false },
  { mode: 'chat', isChatEnabled: true },
])('code result budget ($mode mode)', ({ isChatEnabled }) => {
  it('renders small results exactly as the unbounded inspector does', async () => {
    const variables = {
      total: 4,
      name: 'Ada "Lovelace"\nline 2',
      rows: Array.from({ length: 40 }, (_, i) => ({ id: i, label: `row ${i}` })),
      nested: { a: { b: { c: [1, 2, 3] } }, when: new Date(0) },
      page: html(300),
    }
    const content = await thinking(variables, isChatEnabled)
    const inspection = RESULT_INSPECTION
    const expected = Object.entries(variables)
      .map(([key, value]) => inspect(value, key, inspection))
      .join('\n\n')

    expect(expected.length).toBeLessThan(MAX_RESULT_CHARS)
    expect(content).toContain(expected)
    expect(content).not.toMatch(NOTICE)
  })

  it('truncates a huge string result with an explicit notice', async () => {
    const page = html(20_000)
    const content = await thinking({ page }, isChatEnabled)
    const match = content.match(NOTICE)

    expect(match).not.toBeNull()
    expect(Number(match![1])).toBeLessThanOrEqual(MAX_RESULT_CHARS)
    expect(Number(match![2])).toBeGreaterThan(page.length)
    expect(content).toContain('// const page: string')
    expect(content).toContain('<html><body>')
    expect(content.length).toBeLessThan(MAX_RESULT_CHARS + 5_000)
  })

  it('truncates a huge raw string result', async () => {
    const content = await thinking('x'.repeat(500_000), isChatEnabled)
    expect(content).toMatch(NOTICE)
    expect(content.length).toBeLessThan(MAX_RESULT_CHARS + 5_000)
  })

  it('bounds a large array while keeping its summary and leading items', async () => {
    const files = Array.from({ length: 5_000 }, (_, i) => ({ path: `/repo/src/file-${i}.ts`, content: html(20) }))
    const content = await thinking({ files }, isChatEnabled)

    expect(content).toMatch(NOTICE)
    expect(content).toContain('Total Items:     5000')
    expect(content).toContain('/repo/src/file-0.ts')
    expect(content).toMatch(/\.\.\. \(\d+ more items\)/)
    expect(content.length).toBeLessThan(MAX_RESULT_CHARS + 5_000)
  })

  it('bounds large nested arrays and strings inside an object structurally', async () => {
    const report = { title: 'Inventory', items: Array.from({ length: 3_000 }, (_, i) => `sku-${i}`), body: html(5_000) }
    const content = await thinking({ report }, isChatEnabled)

    expect(content).toMatch(NOTICE)
    expect(content).toContain('"title": "Inventory"')
    expect(content).toMatch(/"items": \["sku-0", "sku-1", .*\.\.\. \(\d+ more items\)\]/)
    expect(content).toContain('<truncated>')
    expect(content.length).toBeLessThan(MAX_RESULT_CHARS + 5_000)
  })

  it('leaves a tool ThinkSignal context to the request budget', async () => {
    const page = `${html(5_000)}END-OF-PAGE`
    const message = await DualModePrompt.getThinkingMessage({ variables: { page }, interrupted: true, isChatEnabled })
    const content = String(message.content)
    expect(page.length).toBeGreaterThan(MAX_RESULT_CHARS)
    expect(content).toContain('END-OF-PAGE')
    expect(content).not.toMatch(NOTICE)
  })
})

describe.each([
  { mode: 'worker', isChatEnabled: false },
  { mode: 'chat', isChatEnabled: true },
])('execution error budget ($mode mode)', ({ isChatEnabled }) => {
  const stacktrace = 'Error: Cannot read properties of undefined\n  at line 7\n  007 | const title = page.title.trim()'

  it('bounds huge variables and tool outputs but keeps the error, stack and every call', async () => {
    const page = html(20_000)
    const toolCalls = [
      { tool: 'fs.readFile', input: { path: '/site/index.html' }, success: true, output: page },
      { tool: 'fs.readFile', input: { path: '/site/about.html' }, success: true, output: page },
      {
        tool: 'fs.writeFile',
        input: { path: '/out.json', content: html(500) },
        success: false,
        error: 'EACCES: permission denied',
      },
    ]
    const message = await DualModePrompt.getCodeExecutionErrorMessage({
      isChatEnabled,
      message: 'TypeError: Cannot read properties of undefined (reading trim)',
      stacktrace,
      variables: { index: page, about: page, listing: Array.from({ length: 2_000 }, (_, i) => `/site/p${i}.html`) },
      toolCalls,
    })
    const content = String(message.content)

    expect(content.length).toBeLessThan(MAX_RESULT_CHARS + 10_000)
    expect(content).toContain('TypeError: Cannot read properties of undefined (reading trim)')
    expect(content).toContain('at line 7')
    expect(content).toContain('007 | const title = page.title.trim()')
    for (const name of ['fs.readFile', 'fs.writeFile']) expect(content).toContain(name)
    expect(content).toContain('/site/index.html')
    expect(content).toContain('/site/about.html')
    expect(content).toContain('/out.json')
    expect(content).toContain('EACCES: permission denied')
    expect(content).toContain(`<truncated, ${page.length} chars total>`)
    expect(content).toMatch(NOTICE)
  })

  it('caps each tool output preview', async () => {
    const output = 'y'.repeat(50_000)
    const message = await DualModePrompt.getCodeExecutionErrorMessage({
      isChatEnabled,
      message: 'Error: failed later',
      stacktrace,
      toolCalls: [{ tool: 'fetch', input: 'https://example.com', success: true, output }],
    })
    const content = String(message.content)
    expect(content).toContain('y'.repeat(MAX_TOOL_CALL_FIELD_CHARS))
    expect(content).not.toContain('y'.repeat(MAX_TOOL_CALL_FIELD_CHARS + 1))
    expect(content).toContain('<truncated, 50000 chars total>')
  })

  it('keeps the variables beside an error short when many large variables were preserved', async () => {
    const pageLines = Array.from(
      { length: 300 },
      (_, i) => `- listitem [ref=e${i}]: product number ${i} with a long title`
    )
    const variables = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`page${i}`, i % 2 ? pageLines : pageLines.join('\n')])
    )
    const message = await DualModePrompt.getCodeExecutionErrorMessage({
      isChatEnabled,
      message: "TypeError: cannot read property '1' of undefined",
      stacktrace,
      variables,
    })
    const content = String(message.content)
    expect(content).toContain('page19')
    expect(content.length).toBeLessThan(10_000)
  })

  it('keeps every call name when many calls ran', async () => {
    const toolCalls = Array.from({ length: 40 }, (_, i) => ({
      tool: `tool_${i}`,
      input: { i },
      success: i !== 39,
      ...(i === 39 ? { error: 'boom at the end' } : { output: 'z'.repeat(5_000) }),
    }))
    const message = await DualModePrompt.getCodeExecutionErrorMessage({
      isChatEnabled,
      message: 'Error: boom at the end',
      stacktrace,
      toolCalls,
    })
    const content = String(message.content)
    for (const { tool } of toolCalls) expect(content).toContain(`"${tool}"`)
    expect(content).toContain('boom at the end')
    expect(content.length).toBeLessThan(MAX_RESULT_CHARS)
  })

  it('renders small errors exactly as the unbounded inspector does', async () => {
    const variables = { count: 3, names: ['a', 'b'] }
    const toolCalls = [
      { tool: 'lookup', input: { id: 1 }, success: true, output: { name: 'a' } },
      { tool: 'lookup', input: { id: 2 }, success: false, error: 'Not found' },
    ]
    const message = await DualModePrompt.getCodeExecutionErrorMessage({
      isChatEnabled,
      message: 'Error: Not found',
      stacktrace,
      variables,
      toolCalls,
    })
    const content = String(message.content)
    expect(content).toContain(inspect(variables))
    expect(content).toContain(inspect(toolCalls))
    expect(content).not.toMatch(NOTICE)
  })

  it('bounds the invalid-response recovery message the same way', async () => {
    const message = await DualModePrompt.getInvalidCodeMessage({
      isChatEnabled,
      code: '■next=done {}',
      message: 'Invalid ■next block (done): missing summary',
      variables: { page: html(20_000) },
      toolCalls: [{ tool: 'fs.readFile', input: { path: '/a.html' }, success: true, output: html(20_000) }],
    })
    const content = String(message.content)
    expect(content).toContain('fs.readFile')
    expect(content).toContain('/a.html')
    expect(content).toMatch(NOTICE)
    expect(content.length).toBeLessThan(MAX_RESULT_CHARS + 10_000)
  })
})
