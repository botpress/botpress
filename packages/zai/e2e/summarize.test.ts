import { check } from '@botpress/vai'
import { describe, it } from 'vitest'

import { BotpressDocumentation, getZai } from './utils'

describe('zai.summarize', () => {
  const zai = getZai()

  it.skip('summarize long document to a concise 2000 token summary', async () => {
    const result = await zai.summarize(BotpressDocumentation, {
      length: 2000,
      prompt: `Extract the Table of Contents for the Botpress Documentation. Pay special attention to all the different features. Focus on horizontal coverage of features rather than going in depth into one feature. The goal is to have a complete overview of what the documentation covers.`,
    })

    check(result, 'The text is a summary of the Botpress documentation').toBe(true)
    check(result, 'The text explains shortly what botpress is').toBe(true)
    check(result, 'The text uses markdown format').toBe(true)
    check(result, 'The text has some information about integrations').toBe(true)
    check(result, 'The text has a section about Flows (or Workflows)').toBe(true)
    check(result, 'The text has a section about the Botpress API').toBe(true)
    check(result, 'The text mentions the notion of workspaces').toBe(true)
    check(result, 'The text has some information about the Webchat').toBe(true)
    check(result, 'The text has some information about HITL (human in the loop)').toBe(true)
  })
})
