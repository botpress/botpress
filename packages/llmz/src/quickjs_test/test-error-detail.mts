#!/usr/bin/env tsx
import { runAsyncFunction } from '../vm.js'

process.env.USE_QUICKJS = 'true'

const code = `
for (let i = 0; i < 10; i++) {
  if (i === 5) {
    throw new Error('Something went wrong')
  }
}
`

const traces = []
const result = await runAsyncFunction({}, code, traces)

console.log('Success:', result.success)
console.log('Error message:', result.error?.message)
console.log('Error message type:', typeof result.error?.message)
console.log('Error instanceof CodeExecutionError:', result.error?.constructor?.name)
console.log('\nError object keys:', Object.keys(result.error || {}))
console.log('\nFull error:', JSON.stringify(result.error, null, 2))
