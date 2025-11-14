#!/usr/bin/env tsx
import { runAsyncFunction } from '../vm.js'

process.env.USE_QUICKJS = 'true'

const code = `
throw new Error('Test error message')
`

const result = await runAsyncFunction({}, code)

console.log('Result:', JSON.stringify(result, null, 2))
console.log('\nError message type:', typeof result.error?.message)
console.log('Error message:', result.error?.message)
