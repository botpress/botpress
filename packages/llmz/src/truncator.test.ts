import { beforeAll, describe, expect, it } from 'vitest'
import { TextTokenizer } from '@botpress/wasm'

import { truncateWrappedContent, wrapContent } from './truncator.js'
import { getTokenizer, init } from './utils.js'

import * as _ from 'lodash-es'

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
`
      }
    ]

    const tokenLimit = 25
    const truncatedMessages = truncateWrappedContent({ messages, tokenLimit })

    const totalTokens = truncatedMessages.reduce((acc, msg) => acc + tokenizer.count(msg.content), 0)

    expect(totalTokens).toBeLessThanOrEqual(tokenLimit)
    expect(truncatedMessages[0].content).toMatchInlineSnapshot(`
      "
      Header
      -----------
      TOKEN
      TOKEN
      TOKEN
      TOKEN
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
`
      }
    ]

    const tokenLimit = 25
    const truncatedMessages = truncateWrappedContent({ messages, tokenLimit })

    const totalTokens = truncatedMessages.reduce((acc, msg) => acc + tokenizer.count(msg.content), 0)

    expect(totalTokens).toBeLessThanOrEqual(tokenLimit)
    expect(truncatedMessages[0].content).toMatchInlineSnapshot(`
      "
      Header
      -----------
      /* TOKEN
      TOKEN
      TOKEN
      TOKEN
      TOKEN
      TOKEN
      TOKEN
      TOKEN */
      -----------
      Footer
      "
    `)
  })

  it('doesnt truncate if the message is already small enough', async () => {
    const messages = [
      {
        role: 'user',
        content: `It's small enough`
      },
      {
        role: 'user',
        content: `That's what she said`
      }
    ]

    const tokenLimit = 25
    const truncatedMessages = truncateWrappedContent({ messages, tokenLimit })
    expect(truncatedMessages[0].content).toMatch(messages[0].content)
    expect(truncatedMessages[1].content).toMatch(messages[1].content)
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
`
      },
      {
        role: 'user',
        content: `
Here's a very big variable:
${wrapContent(ONE_TOKEN.repeat(1000))}

And another one:
${wrapContent(ONE_TOKEN.repeat(9000))}
`
      },
      {
        role: 'user',
        content: `
${wrapContent(ONE_TOKEN.repeat(10_000))}
`
      },
      {
        role: 'user',
        content: `
${wrapContent(ONE_TOKEN.repeat(1000))}
`
      }
    ]

    const tokenLimit = 10_000
    const truncatedMessages = truncateWrappedContent({ messages, tokenLimit })

    const totalTokens = truncatedMessages.reduce((acc, msg) => acc + tokenizer.count(msg.content), 0)

    const before = messages.map((msg) => tokenizer.count(msg.content))
    const after = truncatedMessages.map((msg) => tokenizer.count(msg.content))

    expect(before).toMatchInlineSnapshot(`
      [
        14056,
        20055,
        20023,
        2023,
      ]
    `)
    expect(totalTokens).toBeGreaterThan(tokenLimit - 500)
    expect(totalTokens).toBeLessThanOrEqual(tokenLimit)
    expect(after).toMatchInlineSnapshot(`
      [
        3013,
        3480,
        1751,
        1751,
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
`
      }
    ]

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
`
      }
    ]

    const truncated = truncateWrappedContent({ messages, tokenLimit: 20, throwOnFailure: false })

    expect(truncated[0].content).toMatchInlineSnapshot(`
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
`
      }
    ]

    const truncated = truncateWrappedContent({ messages, tokenLimit: 20, throwOnFailure: false })

    expect(truncated[0].content).toMatchInlineSnapshot(`
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
`
      }
    ]

    const truncated = truncateWrappedContent({ messages, tokenLimit: 20, throwOnFailure: false })

    expect(truncated[0].content).toMatchInlineSnapshot(`
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
`
      }
    ]

    const truncated = truncateWrappedContent({ messages, tokenLimit: 60, throwOnFailure: false })

    expect(truncated[0].content).toMatchInlineSnapshot(`
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
      12
      13
      14
      15
      16
      17
      18
      19
      20
      21
      22
      23
      24
      25
      26
      27
      28
      29
      30
      31
      32
      33
      34
      35
      36
      37
      38
      39
      40
      41
      42
      43
      44
      45
      46
      47
      48
      49
      50
      51
      52
      53
      54
      55
      56
      57
      58
      59
      60
      61
      621459
      1460
      1461
      1462
      1463
      1464
      1465
      1466
      1467
      1468
      1469
      1470
      1471
      1472
      1473
      1474
      1475
      1476
      1477
      1478
      1479
      1480
      1481
      1482
      1483
      1484
      1485
      1486
      1487
      1488
      1489
      1490
      1491
      1492
      1493
      1494
      1495
      1496
      1497
      1498
      1499

      ---------


      978
      979
      980
      981
      982
      983
      984
      985
      986
      987
      988
      989
      990
      991
      992
      993
      994
      995
      996
      997
      998
      999

      """
      "
    `)
  })

  it('truncate flex priority', async () => {
    const messages = [
      {
        role: 'user',
        content: wrapContent(N_TOKENS(4_000), { flex: 1 })
      },
      {
        role: 'user',
        content: wrapContent(N_TOKENS(2_000), { flex: 4 })
      }
    ]

    const truncated = truncateWrappedContent({ messages, tokenLimit: 2000, throwOnFailure: false })
    const tokens = truncated.map((msg) => tokenizer.count(msg.content))
    expect(tokens).toMatchInlineSnapshot(`
      [
        1502,
        498,
      ]
    `)
  })

  it('truncate minTokens', async () => {
    const messages = [
      {
        role: 'user',
        content: wrapContent(N_TOKENS(1000), { flex: 1, minTokens: 275 })
      },
      {
        role: 'user',
        content: wrapContent(N_TOKENS(1000), { flex: 4, minTokens: 100 })
      }
    ]

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
        content: 'Before ' + wrapContent('Intact') + ' After'
      },
      {
        role: 'user',
        content: wrapContent('Before ' + wrapContent('Intact') + ' After')
      },
      {
        role: 'user',
        content: 'Before ' + wrapContent(wrapContent('Intact')) + ' After'
      },
      {
        role: 'user',
        content: wrapContent('Before ' + wrapContent('Intact')) + ' After'
      },
      {
        role: 'user',
        content: wrapContent('Before ' + wrapContent('Intact') + ' After')
      }
    ]

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
