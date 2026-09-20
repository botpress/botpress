import { describe, expect, it } from 'vitest'

import { nativeCall } from '../src/runtime/fixtures/native-client.js'

import {
  checkProtocolTask,
  checkResponseShape,
  evaluateNativeResponse,
  protocolMatrix,
  type ProtocolCase,
} from './__tests__/protocol-matrix.js'

function scenario(kind: ProtocolCase['kind']): ProtocolCase {
  const found = protocolMatrix.find((entry) => entry.kind === kind)

  if (!found) {
    throw new Error(`Missing protocol fixture: ${kind}`)
  }

  return found
}

describe('single-response protocol matrix checker', () => {
  it('keeps code fences in assistant text without executing them', async () => {
    const fixture = scenario('markdown')
    const text = '```python\n"""Documentation example."""\nprint("hello")\n```'

    const parsed = await evaluateNativeResponse(text, [], fixture.props)

    expect(parsed.errors).toEqual([])
    expect(parsed.executionErrors).toEqual([])
    expect(parsed.code).toBeUndefined()
    expect(parsed.businessCalls).toEqual([])
    expect(checkProtocolTask(fixture, parsed)).toBe(true)
    expect(checkResponseShape(fixture, parsed)).toBe(true)
  })

  it('requires a real business call and its inspected result', async () => {
    const fixture = scenario('read')
    const parsed = await evaluateNativeResponse(
      '',
      [nativeCall('run_javascript', { code: 'return inspect(await readAccount())' })],
      fixture.props
    )

    expect(parsed.executionErrors).toEqual([])
    expect(parsed.next).toBeUndefined()
    expect(parsed.inspectedResult).toEqual({ plan: 'Orchid', projects: 17 })
    expect(checkProtocolTask(fixture, parsed)).toBe(true)
  })

  it('does not mistake a function name in a comment for execution', async () => {
    const fixture = scenario('read')
    const parsed = await evaluateNativeResponse(
      '',
      [nativeCall('run_javascript', { code: '// readAccount()\nreturn { plan: "Orchid", projects: 17 }' })],
      fixture.props
    )

    expect(parsed.businessCalls).toEqual([])
    expect(checkProtocolTask(fixture, parsed)).toBe(false)
  })

  it('evaluates computed button arguments followed by explicit completion', async () => {
    const fixture = scenario('buttons')
    const code = [
      'const labels = ["Standard", "Premium"];',
      'chat.buttons(labels.map(label => ({ action: "say", label })));',
      'return exit("listen");',
    ].join('\n')
    const parsed = await evaluateNativeResponse(
      fixture.expected!,
      [nativeCall('run_javascript', { code })],
      fixture.props
    )

    expect(parsed.executionErrors).toEqual([])
    expect(parsed.sends.map((message) => message.name)).toEqual(['message', 'buttons'])
    expect(checkProtocolTask(fixture, parsed)).toBe(true)
    expect(checkResponseShape(fixture, parsed)).toBe(true)
  })

  it('delivers synchronous buttons without implicitly completing the turn', async () => {
    const fixture = scenario('buttons')
    const parsed = await evaluateNativeResponse(
      fixture.expected!,
      [nativeCall('run_javascript', { code: 'chat.buttons([{ action: "say", label: "Standard" }]);' })],
      fixture.props
    )

    expect(parsed.sends.map((message) => message.name)).toEqual(['message', 'buttons'])
    expect(parsed.next).toBeUndefined()
    expect(checkProtocolTask(fixture, parsed)).toBe(false)
  })

  it.each(['', 'return '])('accepts typed completion computed inside JavaScript (%sexit)', async (prefix) => {
    const fixture = scenario('worker')
    const parsed = await evaluateNativeResponse(
      '',
      [nativeCall('run_javascript', { code: `const total = 6 * 7; ${prefix}exit("done", { total });` })],
      fixture.props
    )

    expect(parsed.executionErrors).toEqual([])
    expect(parsed.next).toEqual({ name: 'done', props: { total: 42 } })
    expect(checkProtocolTask(fixture, parsed)).toBe(true)
  })

  it('rejects an ordinary object pretending to be an exit', async () => {
    const fixture = scenario('worker')
    const parsed = await evaluateNativeResponse(
      '',
      [nativeCall('run_javascript', { code: 'return { type: "exit", name: "done", payload: { total: 42 } };' })],
      fixture.props
    )

    expect(parsed.next).toBeUndefined()
    expect(checkProtocolTask(fixture, parsed)).toBe(false)
  })

  it('rejects multiple native calls before either business action executes', async () => {
    const fixture = scenario('read')
    const parsed = await evaluateNativeResponse(
      '',
      [
        nativeCall('run_javascript', { code: 'return inspect(await readAccount())' }),
        nativeCall('run_javascript', { code: 'return inspect(await readAccount())' }),
      ],
      fixture.props
    )

    expect(parsed.errors.length).toBeGreaterThan(0)
    expect(parsed.businessCalls).toEqual([])
    expect(checkProtocolTask(fixture, parsed)).toBe(false)
  })

  it('keeps execution errors separate from native call validity', async () => {
    const fixture = scenario('worker')
    const parsed = await evaluateNativeResponse(
      '',
      [nativeCall('run_javascript', { code: 'throw new Error("fixture failure")' })],
      fixture.props
    )

    expect(parsed.errors).toEqual([])
    expect(parsed.executionErrors.join('\n')).toContain('fixture failure')
    expect(checkProtocolTask(fixture, parsed)).toBe(false)
  })

  it('verifies a silent mutation and completion in one program', async () => {
    const fixture = scenario('save')
    const parsed = await evaluateNativeResponse(
      '',
      [nativeCall('run_javascript', { code: 'await savePreference({ enabled: true }); return exit("listen");' })],
      fixture.props
    )

    expect(parsed.executionErrors).toEqual([])
    expect(parsed.sends).toEqual([])
    expect(checkProtocolTask(fixture, parsed)).toBe(true)
  })
})
