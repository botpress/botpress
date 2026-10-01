import { describe, expect, it } from 'vitest'
import { DualModePrompt } from './dual-modes.js'
import { truncateWrappedContent } from '../truncator.js'
import { getTokenizer } from '../utils.js'

const text = `${'Unrelated search passage with plausible historical policy details.\n'.repeat(600)}\nSOURCE-X718: The current approval code is MICA-629 and the maximum is 734.\n${'Additional unrelated records and older policies.\n'.repeat(600)}`

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
    expect(getTokenizer().count(content)).toBeGreaterThan(10_000)
  })

  it('still applies the real request budget to oversized results', async () => {
    const message = await DualModePrompt.getThinkingMessage({ variables: { content: text }, isChatEnabled: true })
    const [sent] = truncateWrappedContent({ messages: [message], tokenLimit: 2000, throwOnFailure: true })
    expect(getTokenizer().count(String(sent!.content))).toBeLessThanOrEqual(2000)
  })
})
