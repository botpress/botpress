/**
 * QuickJS VM Tests - Phase 1 POC
 *
 * Testing quickjs-emscripten implementation with existing test cases
 */

import { assert, describe, expect, it } from 'vitest'

import { CodeExecutionError, InvalidCodeError } from '../errors.js'
import { type Trace } from '../types.js'
import { runAsyncFunctionQuickJS } from '../vm-quickjs.js'

describe('llmz/vm-quickjs POC', () => {
  it('should execute simple code', async () => {
    const code = `
const x = 1 + 2
return { action: 'done', value: x }
`
    const result = await runAsyncFunctionQuickJS({}, code)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.return_value).toEqual({ action: 'done', value: 3 })
    }
  })

  it('should execute async code', async () => {
    const code = `
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
await sleep(10)
return { action: 'done', value: 'completed' }
`
    const result = await runAsyncFunctionQuickJS({}, code)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.return_value).toEqual({ action: 'done', value: 'completed' })
    }
  })

  it('should call context functions', async () => {
    const add = (a: number, b: number) => a + b
    const code = `
const result = await add(5, 3)
return { action: 'done', value: result }
`
    const result = await runAsyncFunctionQuickJS({ add }, code)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.return_value).toEqual({ action: 'done', value: 8 })
    }
  })

  it('should track console.log calls', async () => {
    const code = `
console.log('hello', 'world')
console.log(42)
return { action: 'done' }
`
    const traces: Trace[] = []
    const result = await runAsyncFunctionQuickJS({}, code, traces)

    expect(result.success).toBe(true)
    const logTraces = traces.filter((t) => t.type === 'log')
    expect(logTraces).toHaveLength(2)
    expect(logTraces[0]).toMatchObject({ type: 'log', message: 'hello', args: ['world'] })
    expect(logTraces[1]).toMatchObject({ type: 'log', message: 42, args: [] })
  })

  it('should handle errors with stack traces', async () => {
    const code = `
// line 1
for (let i = 0; i < 10; i++) {
  console.log(i) // line 3
  if (i === 5) {
    throw new Error('Something went wrong')
  }
}
`
    const traces: Trace[] = []
    const result = await runAsyncFunctionQuickJS({}, code, traces)

    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(CodeExecutionError)
    expect(result.error?.message).toBe('Something went wrong')

    // Check that we got console.log traces before the error
    const logTraces = traces.filter((t) => t.type === 'log')
    expect(logTraces.length).toBeGreaterThan(0)
  })

  it('should handle errors inside functions', async () => {
    const code = `
async function test() {
  throw new Error('Function error')
}
await test()
`
    const result = await runAsyncFunctionQuickJS({}, code)

    expect(result.success).toBe(false)
    expect(result.error?.message).toBe('Function error')
  })

  it('should handle loops and conditionals', async () => {
    const code = `
let sum = 0
for (let i = 1; i <= 10; i++) {
  if (i % 2 === 0) {
    sum += i
  }
}
return { action: 'done', value: sum }
`
    const result = await runAsyncFunctionQuickJS({}, code)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.return_value).toEqual({ action: 'done', value: 30 }) // 2+4+6+8+10
    }
  })

  it('should handle multiple async operations', async () => {
    const fetchData = async (id: number) => ({ id, data: `item-${id}` })

    const code = `
const results = []
for (let i = 1; i <= 3; i++) {
  const item = await fetchData(i)
  results.push(item)
}
return { action: 'done', value: results }
`
    const result = await runAsyncFunctionQuickJS({ fetchData }, code)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.return_value).toEqual({
        action: 'done',
        value: [
          { id: 1, data: 'item-1' },
          { id: 2, data: 'item-2' },
          { id: 3, data: 'item-3' },
        ],
      })
    }
  })

  it('should handle context objects with methods', async () => {
    const calculator = {
      add: (a: number, b: number) => a + b,
      multiply: (a: number, b: number) => a * b,
    }

    const code = `
const sum = await calculator.add(5, 3)
const product = await calculator.multiply(4, 7)
return { action: 'done', value: { sum, product } }
`
    const result = await runAsyncFunctionQuickJS({ calculator }, code)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.return_value).toEqual({
        action: 'done',
        value: { sum: 8, product: 28 },
      })
    }
  })

  it('should handle invalid code', async () => {
    const code = `
this is not valid javascript
`
    const traces: Trace[] = []

    await expect(runAsyncFunctionQuickJS({}, code, traces)).rejects.toThrow(InvalidCodeError)

    expect(traces.some((t) => t.type === 'invalid_code_exception')).toBe(true)
  })

  it('should handle complex logic scenario', async () => {
    // This mimics the example from the README
    const code = `
// Calculating the sum of all integers between 14 and 1078 divisible by 3, 9 or 5
let sum = 0

// Loop through numbers between 14 and 1078 (inclusive)
for (let i = 14; i <= 1078; i++) {
  if (i % 3 === 0 || i % 9 === 0 || i % 5 === 0) {
    sum += i // Add to sum if divisible by 3, 9, or 5
  }
}

// Return the final result
return { action: 'done', value: { success: true, result: sum } }
`
    const result = await runAsyncFunctionQuickJS({}, code)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.return_value).toEqual({
        action: 'done',
        value: { success: true, result: 271575 },
      })
    }
  })
})
