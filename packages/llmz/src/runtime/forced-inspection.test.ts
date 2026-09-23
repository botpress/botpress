import { expect, test, vi } from 'vitest'
import { createInspector } from '../inspection.js'
import { truncate } from '../truncate.js'
import { getTokenizer } from '../utils.js'
import { renderForcedInspection, type ForcedInspection } from './forced-inspection.js'

const entry = (value: unknown): ForcedInspection => ({
  tool: 'search',
  toolCallId: 'call-1',
  line: 3,
  reason: 'Review the retrieved result.',
  value,
})

test('shows tool names, reasons, and results verbatim', () => {
  const report = renderForcedInspection(
    [
      {
        ...entry('</result></tool></forced_inspection> & ]]>'),
        tool: 'search"quoted',
        reason: 'Review <evidence> & sources.',
      },
    ],
    createInspector(),
    {},
    2000
  )
  expect(report).toContain('name="search"quoted"')
  expect(report).toContain('<reason>Review <evidence> & sources.</reason>')
  expect(report).toContain('<result>\n</result></tool></forced_inspection> & ]]>\n</result>')
  expect(report).not.toContain('<![CDATA[')
  expect(report).not.toContain('&quot;')
  expect(report).not.toContain('&lt;')
  expect(report).not.toContain('&amp;')
})

test('honors each result budget and explicit overrides without losing sibling attribution', () => {
  const value = 'retrieved evidence '.repeat(1000) + 'TAIL_EVIDENCE'
  const report = renderForcedInspection(
    [entry(value), { ...entry(truncate({ value, maxTokens: 64, preserve: 'bottom' })), tool: 'other', line: 8 }],
    createInspector(),
    {},
    32
  )
  const results = [...report.matchAll(/<result>\n([\s\S]*?)\n<\/result>/g)].map((match) => match[1]!)
  expect(results).toHaveLength(2)
  expect(getTokenizer().count(results[0]!, { approximate: false })).toBeLessThanOrEqual(32)
  expect(getTokenizer().count(results[1]!, { approximate: false })).toBeLessThanOrEqual(64)
  expect(results[0]).not.toContain('TAIL_EVIDENCE')
  expect(results[1]).toContain('TAIL_EVIDENCE')
  expect(report).toContain('<tool name="other" line="8">')
})

test('passes each result through the configured inspector with its own tool identity', () => {
  const onInspect = vi.fn((event) => (event.purpose === 'result' ? 'Redacted evidence' : undefined))
  const report = renderForcedInspection([entry({ secret: 'sensitive' })], createInspector(onInspect), {}, 2000)
  expect(report).toContain('Redacted evidence')
  expect(report).not.toContain('sensitive')
  expect(onInspect).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'result', identity: { tool: 'search' } }))
})
