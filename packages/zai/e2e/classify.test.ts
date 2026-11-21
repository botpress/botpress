import { describe, it, expect } from 'vitest'

import { getZai } from './utils'

const intents = {
  billing: 'Charges, invoices, refunds, payment methods, subscription price',
  technical: 'Bugs, errors, crashes, outages, something not working',
  account: 'Login, password, profile, access, account settings',
  other: 'Anything else',
}

describe('zai.classify', { timeout: 60_000 }, () => {
  const zai = getZai()

  it('classifies a single input with the classifier', async () => {
    const { output } = await zai.classify('I was charged twice this month', intents).result()
    expect(output.label).toBe('billing')
    expect(output.source).toBe('classifier')
    expect(output.confidence).toBeGreaterThan(0.9)
  })

  it('classifies an array of inputs, one label each', async () => {
    const labels = await zai.classify(
      ['The app crashes when I open settings', 'I forgot my password', 'Where is my invoice?', 'Are you hiring?'],
      intents
    )
    expect(labels).toEqual(['technical', 'account', 'billing', 'other'])
  })

  it('classifies with label names only', async () => {
    expect(await zai.classify('The sky is blue and the grass is green', ['color', 'number', 'animal'])).toBe('color')
  })

  it('uses the LLM with priority accuracy', async () => {
    const { output } = await zai
      .with({ priority: 'accuracy' })
      .classify(['My card was declined', 'Login page is blank'], intents)
      .result()
    expect(output.map((o) => o.label)).toEqual(['billing', 'technical'])
    expect(output.every((o) => o.source === 'llm' && o.confidence === null)).toBe(true)
  })

  it('uses the LLM when examples are given', async () => {
    const { output } = await zai
      .classify('Need the W-9 form for our accounting', intents, {
        examples: [{ input: 'Send me your tax form', label: 'billing', explanation: 'Tax paperwork is billing' }],
      })
      .result()
    expect(output).toMatchObject({ label: 'billing', source: 'llm' })
  })
})
