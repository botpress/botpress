import { describe, test, expect } from 'vitest'
import { cleanStackTrace } from './stack-traces.js'

describe('clean transcript stack traces', () => {
  test('replaces OSX files', () => {
    const stack = `Error: Error
    at /Users/adam/llmz/src/__tests__/index.ts:1:1
    at (/Users/adam/llmz/src/__tests__/index.ts:2:2)
    at Object.<anonymous> /Users/adam/llmz/src/__tests__/index.ts:3:3
    at Object.<anonymous> (/Users/adam/llmz/src/__tests__/index.ts:4:4)
    at /Users/adam/llmz/src/__tests__/index.ts:5:5
    at file://hello/world/node_modules/library/index.js:1:1`

    expect(cleanStackTrace(stack, false)).toMatchInlineSnapshot(`
      "Error: Error
          at /llmz/src/__tests__/index.ts:1:1
          at (/llmz/src/__tests__/index.ts:2:2)
          at Object.<anonymous> /llmz/src/__tests__/index.ts:3:3
          at Object.<anonymous> (/llmz/src/__tests__/index.ts:4:4)
          at /llmz/src/__tests__/index.ts:5:5
          at file://hello/world/node_modules/library/index.js:1:1"
    `)
    expect(cleanStackTrace(stack)).toMatchInlineSnapshot(`"Error: Error"`)
  })

  test('replaces Windows files', () => {
    const stack = `Error: Error
    at C:\\Users\\adam\\llmz\\src\\__tests__\\index.ts:1:1
    at (C:\\Users\\adam\\llmz\\src\\__tests__\\index.ts:2:2)
    at Object.<anonymous> C:\\Users\\adam\\llmz\\src\\__tests__\\index.ts:3:3
    at Object.<anonymous> (C:\\Users\\adam\\llmz\\src\\__tests__\\index.ts:4:4)
    at C:\\Users\\adam\\llmz\\src\\__tests__\\index.ts:5:5
    at file://hello/world/node_modules/library/index.js:1:1`
    expect(cleanStackTrace(stack, false)).toMatchInlineSnapshot(`
      "Error: Error
          at \\llmz\\src\\__tests__\\index.ts:1:1
          at (\\llmz\\src\\__tests__\\index.ts:2:2)
          at Object.<anonymous> \\llmz\\src\\__tests__\\index.ts:3:3
          at Object.<anonymous> (\\llmz\\src\\__tests__\\index.ts:4:4)
          at \\llmz\\src\\__tests__\\index.ts:5:5
          at file://hello/world/node_modules/library/index.js:1:1"
    `)
    expect(cleanStackTrace(stack)).toMatchInlineSnapshot(`"Error: Error"`)
  })
})
