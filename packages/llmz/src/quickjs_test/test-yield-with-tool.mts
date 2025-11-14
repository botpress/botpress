#!/usr/bin/env tsx
import { runAsyncFunction } from '../vm.js'

process.env.USE_QUICKJS = 'true'

// Create a context with a Text tool
const context = {
  Text: async (component: any) => {
    console.log('Text tool called with:', component.children)
  }
}

const code = `
yield <Text>Hello</Text>
yield <Text>World</Text>
return { action: 'done', value: 'completed' }
`

const traces = []
const result = await runAsyncFunction(context, code, traces)

console.log('\nSuccess:', result.success)
console.log('Return value:', JSON.stringify(result.return_value))
console.log('Yield count:', traces.filter(t => t.type === 'yield').length)
