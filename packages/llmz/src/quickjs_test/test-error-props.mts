#!/usr/bin/env tsx
import { runAsyncFunction } from '../vm.js'

process.env.USE_QUICKJS = 'true'

const code = `throw new Error('Something went wrong')`
const result = await runAsyncFunction({}, code)

console.log('result.error:', result.error)
console.log('\nresult.error.message:', result.error?.message)
console.log('Type of message:', typeof result.error?.message)
console.log('\nHas message property:', 'message' in (result.error || {}))
console.log('Property descriptor:', Object.getOwnPropertyDescriptor(result.error, 'message'))

// Try accessing as different types
const err: any = result.error
console.log('\nerr.message:', err.message)
console.log('JSON.stringify(err):', JSON.stringify(err))
