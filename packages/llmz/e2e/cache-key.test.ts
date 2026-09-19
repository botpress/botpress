import type { CognitiveRequest } from '@botpress/cognitive'
import { describe, expect, it } from 'vitest'
import { cacheKeyOf, stringifyWithSortedKeys } from './__tests__/cache-key.js'

const FIRST_ID = 'tcall_01M2VJ67XKBKK1WRJ0E9874JM5'
const SECOND_ID = 'tcall_01M2VJ67XKBKK1WRJ0E9874JM6'
const THIRD_ID = 'tcall_01M2VJ67XKBKK1WRJ0E9874JM7'
const FOURTH_ID = 'tcall_01M2VJ67XKBKK1WRJ0E9874JM8'

function request(report: string): CognitiveRequest {
  return {
    model: 'openai:gpt-5.6-luna',
    messages: [
      { role: 'system', content: 'Answer using the exact returned documentation.' },
      {
        role: 'assistant',
        type: 'tool_calls',
        content: '',
        toolCalls: [
          {
            id: 'native-call-1',
            type: 'function',
            function: { name: 'run_javascript', arguments: { code: 'return inspect(await getDocumentation());' } },
          },
        ],
      },
      { role: 'user', type: 'tool_result', toolResultCallId: 'native-call-1', content: report },
    ],
  }
}

function report(id: string, output = '"print(name.upper())"'): string {
  return `INTERRUPTED\nDocumentation retrieved.\n\nBUSINESS CALL OUTCOMES\n- getDocumentation (${id}): returned ${output}`
}

describe('E2E response cache identity', () => {
  it('reuses an unchanged execution report with newly generated diagnostic call IDs without changing the request', () => {
    const first = request(report(FIRST_ID))
    const second = request(report(SECOND_ID))
    const original = structuredClone(first)

    expect(cacheKeyOf('stream', first)).toBe(cacheKeyOf('stream', second))
    expect(first).toEqual(original)
    expect(stringifyWithSortedKeys(first)).toContain(FIRST_ID)
  })

  it('preserves repeated diagnostic ID relationships', () => {
    const calls = (first: string, second: string) =>
      `BUSINESS CALL OUTCOMES\n- read (${first}): returned 1\n- read (${second}): returned 1`

    expect(cacheKeyOf('stream', request(calls(FIRST_ID, SECOND_ID)))).toBe(
      cacheKeyOf('stream', request(calls(THIRD_ID, FOURTH_ID)))
    )
    expect(cacheKeyOf('stream', request(calls(FIRST_ID, FIRST_ID)))).toBe(
      cacheKeyOf('stream', request(calls(THIRD_ID, THIRD_ID)))
    )
    expect(cacheKeyOf('stream', request(calls(FIRST_ID, FIRST_ID)))).not.toBe(
      cacheKeyOf('stream', request(calls(FIRST_ID, SECOND_ID)))
    )
  })

  it('recognizes report sections after context ending in a newline without changing their spacing', () => {
    const first = request(report(FIRST_ID).replace('\n\nBUSINESS', '\n\n\nBUSINESS'))
    const second = request(report(SECOND_ID).replace('\n\nBUSINESS', '\n\n\nBUSINESS'))

    expect(cacheKeyOf('stream', first)).toBe(cacheKeyOf('stream', second))
    expect(cacheKeyOf('stream', first)).not.toBe(cacheKeyOf('stream', request(report(FIRST_ID))))
  })

  it.each([
    ['returned source', report(FIRST_ID, '"print(name.lower())"')],
    ['tool name', report(FIRST_ID).replace('getDocumentation (', 'getAccount (')],
    ['outcome', report(FIRST_ID).replace(': returned ', ': failed: ')],
    ['context', report(FIRST_ID).replace('Documentation retrieved.', 'Documentation is incomplete.')],
    ['another section', `${report(FIRST_ID)}\n\nCREATED\n- reference: "${SECOND_ID}"`],
  ])('keeps %s significant', (_name, changed) => {
    expect(cacheKeyOf('stream', request(report(FIRST_ID)))).not.toBe(cacheKeyOf('stream', request(changed)))
  })

  it('preserves generated-looking IDs inside returned payloads', () => {
    const first = request(report(FIRST_ID, `{ id: "${FIRST_ID}" }`))
    const second = request(report(SECOND_ID, `{ id: "${SECOND_ID}" }`))

    expect(cacheKeyOf('stream', first)).not.toBe(cacheKeyOf('stream', second))
  })

  it('preserves tool ordering', () => {
    const first = `BUSINESS CALL OUTCOMES\n- read (${FIRST_ID}): returned 1\n- write (${SECOND_ID}): returned 2`
    const second = `BUSINESS CALL OUTCOMES\n- write (${SECOND_ID}): returned 2\n- read (${FIRST_ID}): returned 1`

    expect(cacheKeyOf('stream', request(first))).not.toBe(cacheKeyOf('stream', request(second)))
  })

  it.each(['instructions', 'code', 'schema', 'native call ID'])('preserves %s in the request', (field) => {
    const first = request(report(FIRST_ID))
    const second = structuredClone(first)

    if (field === 'instructions') {
      first.messages[0]!.content = FIRST_ID
      second.messages[0]!.content = SECOND_ID
    } else if (field === 'code') {
      first.messages[1]!.toolCalls![0]!.function.arguments = { code: `return "${FIRST_ID}";` }
      second.messages[1]!.toolCalls![0]!.function.arguments = { code: `return "${SECOND_ID}";` }
    } else if (field === 'schema') {
      first.tools = [{ name: 'run_javascript', parameters: { description: FIRST_ID } }]
      second.tools = [{ name: 'run_javascript', parameters: { description: SECOND_ID } }]
    } else {
      second.messages[1]!.toolCalls![0]!.id = 'native-call-2'
      second.messages[2]!.toolResultCallId = 'native-call-2'
    }

    expect(cacheKeyOf('stream', first)).not.toBe(cacheKeyOf('stream', second))
  })

  it.each(['ordinary message', 'another native tool', 'unmatched tool result', 'outside report section'])(
    'does not normalize IDs in %s',
    (scenario) => {
      const first = request(report(FIRST_ID))
      const second = request(report(SECOND_ID))

      for (const input of [first, second]) {
        if (scenario === 'ordinary message') {
          input.messages[2]!.type = 'text'
        } else if (scenario === 'another native tool') {
          input.messages[1]!.toolCalls![0]!.function.name = 'another_tool'
        } else if (scenario === 'unmatched tool result') {
          input.messages[2]!.toolResultCallId = 'unrelated-call'
        } else {
          input.messages[2]!.content = String(input.messages[2]!.content).replace('BUSINESS CALL OUTCOMES', 'RETURN')
        }
      }

      expect(cacheKeyOf('stream', first)).not.toBe(cacheKeyOf('stream', second))
    }
  )

  it('does not normalize arbitrary non-ULID business identifiers', () => {
    expect(cacheKeyOf('stream', request(report('tcall_account_1')))).not.toBe(
      cacheKeyOf('stream', request(report('tcall_account_2')))
    )
  })

  it('keeps stream and text responses separate', () => {
    const input = request(report(FIRST_ID))

    expect(cacheKeyOf('stream', input)).not.toBe(cacheKeyOf('text', input))
  })

  it('keeps the existing lexical object-key ordering', () => {
    expect(stringifyWithSortedKeys({ z: 1, A: { b: 2, B: 3 }, a: [1, 2] })).toBe('{"A":{"B":3,"b":2},"a":[1,2],"z":1}')
  })
})
