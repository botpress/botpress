#!/usr/bin/env tsx
import { runAsyncFunction } from '../vm.js'

process.env.USE_QUICKJS = 'true'

const code = `
yield <Text>Hello</Text>
yield <Text>World</Text>
return { action: 'done', value: 'completed' }
`

const traces = []
const result = await runAsyncFunction({}, code, traces)

console.log('Success:', result.success)
console.log('Return value:', result.return_value)
console.log('Traces:', traces.filter(t => t.type === 'yield'))
