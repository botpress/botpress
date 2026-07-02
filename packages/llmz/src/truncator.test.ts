import { TextTokenizer } from '@bpinternal/thicktoken/micro'

import { beforeAll, describe, expect, it } from 'vitest'

import { truncateWrappedContent, wrapContent } from './truncator.js'
import { getTokenizer, init } from './utils.js'

import * as _ from 'lodash-es'
import { LLMzPrompts } from './prompts/prompt.js'

const ONE_TOKEN = 'TOKEN\n'

const N_TOKENS = (n: number) =>
  _.range(1, n)
    .map((n) => `${n}\n`)
    .join('')

describe('truncator', () => {
  let tokenizer: TextTokenizer

  beforeAll(async () => {
    await init()
    tokenizer = getTokenizer()
  })

  it('truncates a single message', async () => {
    const messages = [
      {
        role: 'user',
        content: `
Header
-----------
${wrapContent(ONE_TOKEN.repeat(250))}
-----------
Footer
`,
      },
    ] satisfies LLMzPrompts.Message[]

    const tokenLimit = 25
    const truncatedMessages = truncateWrappedContent({ messages, tokenLimit })

    const totalTokens = truncatedMessages.reduce((acc, msg) => acc + tokenizer.count(msg.content), 0)

    expect(totalTokens).toBeLessThanOrEqual(tokenLimit)
    expect(truncatedMessages[0]!.content).toMatchInlineSnapshot(`
      "
      Header
      -----------
      TOKEN
      TOKEN
      TOKEN
      TOKEN
      TOKEN

      -----------
      Footer
      "
    `)
  })

  it('truncates in-middle of text too', async () => {
    const messages = [
      {
        role: 'user',
        content: `
Header
-----------
/* ${wrapContent(ONE_TOKEN.repeat(250))} */
-----------
Footer
`,
      },
    ] satisfies LLMzPrompts.Message[]

    const tokenLimit = 25
    const truncatedMessages = truncateWrappedContent({ messages, tokenLimit })

    const totalTokens = truncatedMessages.reduce((acc, msg) => acc + tokenizer.count(msg.content), 0)

    expect(totalTokens).toBeLessThanOrEqual(tokenLimit)
    expect(truncatedMessages[0]!.content).toMatchInlineSnapshot(`
      "
      Header
      -----------
      /* TOKEN
      TOKEN
      TOKEN
      TOKEN
      T */
      -----------
      Footer
      "
    `)
  })

  it('doesnt truncate if the message is already small enough', async () => {
    const messages = [
      {
        role: 'user',
        content: `It's small enough`,
      },
      {
        role: 'user',
        content: `That's what she said`,
      },
    ] satisfies LLMzPrompts.Message[]

    const tokenLimit = 25
    const truncatedMessages = truncateWrappedContent({ messages, tokenLimit })
    expect(truncatedMessages[0]!.content).toMatch(messages[0]!.content)
    expect(truncatedMessages[1]!.content).toMatch(messages[1]!.content)
  })

  it('truncates multiple messages and each wrappers equally', async () => {
    const messages = [
      {
        role: 'user',
        content: `
Here's a very big variable:
${wrapContent(ONE_TOKEN.repeat(2000))}

And another one:
${wrapContent(ONE_TOKEN.repeat(5000))}
...
`,
      },
      {
        role: 'user',
        content: `
Here's a very big variable:
${wrapContent(ONE_TOKEN.repeat(1000))}

And another one:
${wrapContent(ONE_TOKEN.repeat(9000))}
`,
      },
      {
        role: 'user',
        content: `
${wrapContent(ONE_TOKEN.repeat(10_000))}
`,
      },
      {
        role: 'user',
        content: `
${wrapContent(ONE_TOKEN.repeat(1000))}
`,
      },
    ] satisfies LLMzPrompts.Message[]

    const tokenLimit = 10_000
    const truncatedMessages = truncateWrappedContent({ messages, tokenLimit })

    const totalTokens = truncatedMessages.reduce((acc, msg) => acc + tokenizer.count(msg.content), 0)

    const before = messages.map((msg) => tokenizer.count(msg.content))
    const after = truncatedMessages.map((msg) => tokenizer.count(msg.content))

    expect(before).toMatchInlineSnapshot(`
      [
        21057,
        30056,
        30023,
        3023,
      ]
    `)
    expect(totalTokens).toBeGreaterThan(tokenLimit - 500)
    expect(totalTokens).toBeLessThanOrEqual(tokenLimit)
    expect(after).toMatchInlineSnapshot(`
      [
        3013,
        3481,
        1752,
        1752,
      ]
    `)
  })

  it('throw if truncate is not enough', async () => {
    const messages = [
      {
        role: 'user',
        content: `
Here's a very big variable:
${wrapContent(ONE_TOKEN.repeat(1_000))}
Now, here's some content that you can't truncate:
${ONE_TOKEN.repeat(1_000)}
`,
      },
    ] satisfies LLMzPrompts.Message[]

    expect(() => truncateWrappedContent({ messages, tokenLimit: 500, throwOnFailure: true })).toThrow()
  })

  it('truncate direction = remove top first', async () => {
    const messages = [
      {
        role: 'user',
        content: `
Here's a very big variable:
"""
${wrapContent(N_TOKENS(1_000), { preserve: 'top' })}
"""
`,
      },
    ] satisfies LLMzPrompts.Message[]

    const truncated = truncateWrappedContent({ messages, tokenLimit: 20, throwOnFailure: false })

    expect(truncated[0]!.content).toMatchInlineSnapshot(`
      "
      Here's a very big variable:
      """
      1
      2
      3
      4
      5
      """
      "
    `)
  })

  it('truncate direction = remove top first', async () => {
    const messages = [
      {
        role: 'user',
        content: `
Here's a very big variable:
"""
${wrapContent(N_TOKENS(1_000), { preserve: 'bottom' })}
"""
`,
      },
    ] satisfies LLMzPrompts.Message[]

    const truncated = truncateWrappedContent({ messages, tokenLimit: 20, throwOnFailure: false })

    expect(truncated[0]!.content).toMatchInlineSnapshot(`
      "
      Here's a very big variable:
      """

      996
      997
      998
      999

      """
      "
    `)
  })

  it('truncate direction = both', async () => {
    const messages = [
      {
        role: 'user',
        content: `
Here's a very big variable:
"""
${wrapContent(N_TOKENS(1_000), { preserve: 'both' })}
"""
`,
      },
    ] satisfies LLMzPrompts.Message[]

    const truncated = truncateWrappedContent({ messages, tokenLimit: 20, throwOnFailure: false })

    expect(truncated[0]!.content).toMatchInlineSnapshot(`
      "
      Here's a very big variable:
      """
      1
      2

      998
      999

      """
      "
    `)
  })

  it('truncate direction mix', async () => {
    const messages = [
      {
        role: 'user',
        content: `
Here's a very big variable:
"""
${wrapContent(N_TOKENS(2_000), { preserve: 'top' })}

---------

${wrapContent(N_TOKENS(1_500), { preserve: 'both' })}

---------

${wrapContent(N_TOKENS(1_000), { preserve: 'bottom' })}
"""
`,
      },
    ] satisfies LLMzPrompts.Message[]

    const truncated = truncateWrappedContent({ messages, tokenLimit: 60, throwOnFailure: false })

    expect(truncated[0]!.content).toMatchInlineSnapshot(`
      "
      Here's a very big variable:
      """


      ---------

      1
      2
      3
      4
      5
      6
      7
      8
      9
      10
      11
      1493
      1494
      1495
      1496
      1497
      1498
      1499


      ---------


      """
      "
    `)
  })

  it('truncate flex priority', async () => {
    const messages = [
      {
        role: 'user',
        content: wrapContent(N_TOKENS(4_000), { flex: 1 }),
      },
      {
        role: 'user',
        content: wrapContent(N_TOKENS(2_000), { flex: 4 }),
      },
    ] satisfies LLMzPrompts.Message[]

    const truncated = truncateWrappedContent({ messages, tokenLimit: 2000, throwOnFailure: false })
    const tokens = truncated.map((msg) => tokenizer.count(msg.content))
    expect(tokens).toMatchInlineSnapshot(`
      [
        1411,
        589,
      ]
    `)
  })

  it('truncate minTokens', async () => {
    const messages = [
      {
        role: 'user',
        content: wrapContent(N_TOKENS(1000), { flex: 1, minTokens: 275 }),
      },
      {
        role: 'user',
        content: wrapContent(N_TOKENS(1000), { flex: 4, minTokens: 100 }),
      },
    ] satisfies LLMzPrompts.Message[]

    const truncated = truncateWrappedContent({ messages, tokenLimit: 50, throwOnFailure: false })
    const tokens = truncated.map((msg) => tokenizer.count(msg.content))

    expect(tokens).toMatchInlineSnapshot(`
      [
        275,
        100,
      ]
    `)
  })
})

describe('bug fixes', () => {
  it(`nested truncate wraps are stripped out`, async () => {
    const messages = [
      {
        role: 'user',
        content: 'Before ' + wrapContent('Intact') + ' After',
      },
      {
        role: 'user',
        content: wrapContent('Before ' + wrapContent('Intact') + ' After'),
      },
      {
        role: 'user',
        content: 'Before ' + wrapContent(wrapContent('Intact')) + ' After',
      },
      {
        role: 'user',
        content: wrapContent('Before ' + wrapContent('Intact')) + ' After',
      },
      {
        role: 'user',
        content: wrapContent('Before ' + wrapContent('Intact') + ' After'),
      },
    ] satisfies LLMzPrompts.Message[]

    const truncatedMessages = truncateWrappedContent({ messages, tokenLimit: 10000 })

    expect(truncatedMessages.map((x) => x.content)).toMatchInlineSnapshot(`
      [
        "Before Intact After",
        "Before Intact After",
        "Before Intact After",
        "Before Intact After",
        "Before Intact After",
      ]
    `)
  })
})
