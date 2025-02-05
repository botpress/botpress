import { describe, it, expect } from 'vitest'
import { check } from '@botpress/vai'

import { getZai, tokenizer } from './utils'

describe('zai.text', { timeout: 60_000 }, () => {
  const zai = getZai()

  it('generate a horror novel with no params', async () => {
    const story = await zai.text('write a short horror novel')
    check(story, 'is a short horror story').toBe(true)
  })

  it('No fluffy text at the beginning', async () => {
    const story = await zai.text('write a short horror novel')

    check(story, 'There is no LLM fluff at the beginning', {
      examples: [
        {
          value: 'Title: A horror story\nChapter 1: The woods\nOnce upen a time, ...',
          expected: true,
          reason: 'It begins straight with a story, no fluff at the beginning',
        },
        { value: 'Once upon a time, a ...', expected: true, reason: 'The story starts directly' },
        {
          value: 'Sure, I will generate a story.\nOnce upen a time, a...',
          expected: false,
          reason: 'There is some fluff at the beginning',
        },
      ],
    }).toBe(true)
  })

  it('No fluffy text at the end', async () => {
    const story = await zai.text('write a short horror novel')

    check(story, 'There is no LLM fluff at the end', {
      examples: [
        {
          value: 'Title: A horror story\nChapter 1: The woods\nOnce upen a time, ... The End.',
          expected: true,
          reason: 'The end is clear and direct, no fluff at the end',
        },
        {
          value:
            'Sure, I will generate a story.\nOnce upen a time, a... The End.\nLet me know if you want more or if you are happy with this.',
          expected: false,
          reason: 'There is some fluff from the assistant at the end.',
        },
      ],
    }).toBe(true)
  })

  it('length/max tokens param', async () => {
    const story = await zai.text('write a short but complete horror story (with conclusion)', { length: 100 })
    expect(tokenizer.count(story)).toBeLessThanOrEqual(110)

    check(story, 'could be the beginning of a horror story').toBe(true)
  })
})
