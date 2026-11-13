import { describe, expect, it } from 'vitest'
import { DualModePrompt } from './dual-modes.js'
import { MAX_RESULT_CHARS } from './result-budget.js'
import { truncateWrappedContent } from '../truncator.js'
import { getTokenizer } from '../utils.js'

const buildText = (repeats: number) =>
  `${'Unrelated search passage with plausible historical policy details.\n'.repeat(repeats)}\nSOURCE-X718: The current approval code is MICA-629 and the maximum is 734.\n${'Additional unrelated records and older policies.\n'.repeat(repeats)}`

// Code results are capped at MAX_RESULT_CHARS (~150K chars), so the "fits" case uses ~33K chars.
const text = buildText(280)
// ~235K chars: larger than the code result budget.
const oversized = buildText(2_000)

describe('long search result evidence', () => {
  it.each([
    { name: 'string field', variables: { content: text } },
    { name: 'string array', variables: { results: [text] } },
    { name: 'top-level array', variables: [text] },
    { name: 'nested document', variables: { results: [{ id: 'SOURCE-X718', content: text }] } },
    { name: 'raw text', variables: text },
  ])('preserves buried evidence and the full result when it fits: $name', async ({ variables }) => {
    const message = await DualModePrompt.getThinkingMessage({ variables, isChatEnabled: true })
    const [sent] = truncateWrappedContent({ messages: [message], tokenLimit: 100_000, throwOnFailure: true })
    const content = String(sent!.content)
    expect(content).toContain('MICA-629')
    expect(content).toContain('734')
    expect(content).not.toContain('<truncated>')
    expect(getTokenizer().count(content)).toBeGreaterThan(5_000)
  })

  it.each([
    { name: 'string field', variables: { content: oversized } },
    { name: 'string array', variables: { results: [oversized] } },
    { name: 'top-level array', variables: [oversized] },
    { name: 'nested document', variables: { results: [{ id: 'SOURCE-X718', content: oversized }] } },
    { name: 'raw text', variables: oversized },
  ])('caps an oversized code result and says how to see the rest: $name', async ({ variables }) => {
    const message = await DualModePrompt.getThinkingMessage({ variables, isChatEnabled: true })
    const content = String(message.content)
    expect(content).toMatch(
      /\[truncated: showing \d+ of \d+ chars — return a smaller slice or filter to see the rest\]/
    )
    expect(content).toContain('Unrelated search passage')
    expect(content.length).toBeLessThan(MAX_RESULT_CHARS + 5_000)
  })

  it('keeps a tool ThinkSignal context whole, leaving it to the request budget', async () => {
    const message = await DualModePrompt.getThinkingMessage({
      variables: { content: oversized },
      interrupted: true,
      isChatEnabled: true,
    })
    const content = String(message.content)
    expect(content).toContain('MICA-629')
    expect(content).not.toContain('[truncated:')
  })

  it('still applies the real request budget to oversized results', async () => {
    const message = await DualModePrompt.getThinkingMessage({ variables: { content: text }, isChatEnabled: true })
    const [sent] = truncateWrappedContent({ messages: [message], tokenLimit: 2000, throwOnFailure: true })
    expect(getTokenizer().count(String(sent!.content))).toBeLessThanOrEqual(2000)
  })
})
