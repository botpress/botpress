import { describe, expect, it } from 'vitest'
import { DefaultComponents } from '../component.default.js'
import { Iteration } from '../context.js'
import { Signals, ThinkSignal } from '../errors.js'
import type { Trace, Traces } from '../types.js'
import { getTokenizer } from '../utils.js'
import { getExecutionActivity, renderMessageDeliveries, renderToolCalls } from './execution-activity.js'

function createIteration(...traces: Trace[]): Iteration {
  const iteration = new Iteration({
    id: 'activity',
    parameters: {
      tools: [],
      objects: [],
      exits: [],
      components: new Map(),
      chatEnabled: false,
      model: 'test',
      temperature: 0,
    },
    systemMessage: { role: 'system', content: '' },
  })

  iteration.traces.push(...traces)

  return iteration
}

function succeeded(id: string, output: unknown = { receipt: 'receipt-42' }, input: unknown = { id: 42 }) {
  return {
    type: 'tool_call',
    tool_name: 'readAccount',
    object: 'accounts',
    tool_call_id: id,
    started_at: 1,
    ended_at: 2,
    success: true,
    input,
    output,
  } satisfies Traces.ToolCall
}

function delivery(id: string, value: unknown, success = true, error?: string): Traces.YieldTrace {
  return { type: 'yield', started_at: 1, ended_at: 2, message_id: id, value, success, error }
}

describe('execution activity', () => {
  it('reports signals as interruptions without interpreting successful JSON output as control flow', () => {
    const think = new ThinkSignal('Inspect the retrieved evidence.')
    const serializedThink = new Error(Signals.serializeError(new ThinkSignal('Review the completed work.')))
    const iteration = createIteration(
      succeeded('success'),
      { ...succeeded('failure'), success: false, error: new Error('Account unavailable.') },
      succeeded('thinking', think),
      { ...succeeded('serialized-thinking'), success: false, error: serializedThink },
      succeeded('normal-json', Signals.serializeError(think))
    )
    const activity = getExecutionActivity(iteration)
    const report = renderToolCalls(activity)!

    expect(activity.calls).toHaveLength(5)
    expect(activity.deliveries).toHaveLength(0)
    expect(report.match(/accounts\.readAccount\(\{ id: 42 \}\): succeeded/g)).toHaveLength(2)
    expect(report.match(/accounts\.readAccount\(\{ id: 42 \}\): failed/g)).toHaveLength(1)
    expect(report.match(/accounts\.readAccount\(\{ id: 42 \}\): interrupted/g)).toHaveLength(2)
    expect(report).toContain('Account unavailable.')
    expect(report).toContain('pending; "Inspect the retrieved evidence."')
    expect(report).not.toContain('normal-json')
    expect(report).not.toContain('receipt-42')
  })

  it('includes successful return previews only when recovery needs to avoid repeating work', () => {
    const activity = getExecutionActivity(createIteration(succeeded('lookup', { accountId: 'acct-42' })))

    expect(renderToolCalls(activity)).not.toContain('acct-42')
    expect(renderToolCalls(activity, true)).toContain(
      'accounts.readAccount({ id: 42 }): succeeded; returned { accountId: "acct-42" }'
    )
    expect(renderToolCalls(activity, true)).not.toContain('lookup')
  })

  it('omits missing arguments and bounds unusually long names', () => {
    const iteration = createIteration(
      { ...succeeded('without-arguments'), input: undefined },
      { ...succeeded('long-name'), tool_name: 'longToolName'.repeat(1000), input: undefined }
    )
    const report = renderToolCalls(getExecutionActivity(iteration))!
    const lines = report.split('\n').slice(1)

    expect(lines[0]).toBe('- accounts.readAccount(): succeeded')
    expect(lines[1]).toContain('[truncated]')
    expect(getTokenizer().count(lines[1]!)).toBeLessThanOrEqual(25)
    expect(report).not.toContain('undefined')
  })

  it('reports delivered button, media, and text props while excluding native assistant prose', () => {
    const iteration = createIteration(
      { type: 'yield', started_at: 1, value: { type: 'text', text: 'Ordinary assistant reply.' } },
      delivery('button-1', DefaultComponents.Buttons.render([{ label: 'Continue', action: 'say' }])),
      delivery('image-1', DefaultComponents.Image.render({ url: 'https://example.com/photo.jpg', alt: 'The trail' })),
      delivery('card-1', DefaultComponents.Card.render({ title: 'Standard', text: 'Five projects included.' }))
    )
    const activity = getExecutionActivity(iteration)
    const report = renderMessageDeliveries(getExecutionActivity(iteration))!

    expect(activity.deliveries).toHaveLength(3)
    expect(report).toContain('- buttons [ { action: "say", label: "Continue" } ]: delivered')
    expect(report).toContain('- image ')
    expect(report).toContain('https://example.com/photo.jpg')
    expect(report).toContain('The trail')
    expect(report).toContain('- card { title: "Standard", text: "Five projects included." }: delivered')
    expect(report).not.toContain('button-1')
    expect(report).not.toContain('image-1')
    expect(report).not.toContain('card-1')
    expect(report).not.toContain('Ordinary assistant reply.')
  })

  it('retains uncertain delivery outcomes and distinguishes failure from cancellation', () => {
    const button = DefaultComponents.Buttons.render([{ label: 'Retry' }])
    const failed = createIteration(delivery('message-1', button, false, 'Network disconnected.'))
    const cancelled = createIteration(delivery('message-2', button))
    cancelled.end({ type: 'aborted', aborted: { reason: 'Stopped by the user.' } })

    expect(renderMessageDeliveries(getExecutionActivity(failed))).toContain(
      '- buttons [ { action: "say", label: "Retry" } ]: uncertain'
    )
    expect(renderMessageDeliveries(getExecutionActivity(failed))).toContain('Network disconnected.')
    expect(renderMessageDeliveries(getExecutionActivity(failed))).toContain(
      'Messages queued after the failed delivery were skipped.'
    )
    expect(renderMessageDeliveries(getExecutionActivity(cancelled), true)).toContain(
      'Messages still queued when execution was cancelled were skipped.'
    )
    expect(renderMessageDeliveries(getExecutionActivity(cancelled), false)).not.toContain('cancelled')

    const unacknowledged = createIteration({ type: 'yield', started_at: 1, message_id: 'unknown', value: button })

    expect(renderMessageDeliveries(getExecutionActivity(unacknowledged))).toContain(
      '- buttons [ { action: "say", label: "Retry" } ]: uncertain'
    )
    expect(renderMessageDeliveries(getExecutionActivity(unacknowledged))).not.toContain('failed delivery')
  })

  it('bounds entry counts, argument previews, recovery values, payloads, and errors', () => {
    const large = 'x'.repeat(10_000) + 'HIDDEN_TAIL'
    const traces = Array.from({ length: 23 }, (_, index) => succeeded(`call-${index}`, large, { query: large }))
    const iteration = createIteration(...traces)

    for (let index = 0; index < 23; index++) {
      iteration.traces.push(
        delivery(`message-${index}`, DefaultComponents.Card.render({ title: 'Card', text: large }), false, large)
      )
    }

    const activity = getExecutionActivity(iteration)
    const calls = renderToolCalls(activity, true)!
    const messages = renderMessageDeliveries(getExecutionActivity(iteration))!

    expect(activity.calls).toHaveLength(23)
    expect(activity.deliveries).toHaveLength(23)
    expect(calls.match(/^- accounts\.readAccount/gm)).toHaveLength(20)
    expect(messages.match(/^- card /gm)).toHaveLength(20)
    expect(calls).toContain('3 additional calls')
    expect(messages).toContain('3 additional deliveries')
    expect(calls).toContain('[truncated]')
    expect(messages).toContain('[truncated]')
    expect(calls).not.toContain('HIDDEN_TAIL')
    expect(messages).not.toContain('HIDDEN_TAIL')

    for (const line of calls.split('\n').filter((line) => line.startsWith('- accounts.'))) {
      expect(getTokenizer().count(line)).toBeLessThanOrEqual(180)
    }

    for (const line of messages.split('\n').filter((line) => line.startsWith('- card '))) {
      expect(getTokenizer().count(line)).toBeLessThanOrEqual(160)
    }
  })

  it('returns no sections when only native assistant output was recorded', () => {
    const iteration = createIteration({ type: 'yield', started_at: 1, value: 'Hello.' })

    expect(getExecutionActivity(iteration).deliveries).toHaveLength(0)
    expect(renderToolCalls(getExecutionActivity(iteration))).toBeUndefined()
    expect(renderMessageDeliveries(getExecutionActivity(iteration))).toBeUndefined()
  })
})
