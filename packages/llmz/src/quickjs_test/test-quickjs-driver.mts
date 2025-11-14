#!/usr/bin/env tsx
/**
 * Test QuickJS driver integration - Phase 2
 * Run with: USE_QUICKJS=true tsx test-quickjs-driver.mts
 */

// Set env var programmatically for testing
process.env.USE_QUICKJS = 'true'

import { runAsyncFunction } from '../vm.js'

async function main() {
  console.log('🧪 Testing QuickJS Driver Integration\n')

  // Test 1: Simple execution
  console.log('Test 1: Simple code execution')
  try {
    const code1 = `
const x = 1 + 2
const y = x * 3
return { action: 'done', value: y }
`
    const result1 = await runAsyncFunction({}, code1)
    if (result1.success && result1.return_value?.value === 9) {
      console.log('✅ Simple execution works:', result1.return_value?.value)
    } else {
      console.log('❌ Simple execution failed:', result1)
    }
  } catch (err: any) {
    console.log('❌ Error:', err.message)
  }

  // Test 2: Loops
  console.log('\nTest 2: Loops and conditionals')
  try {
    const code2 = `
let sum = 0
for (let i = 1; i <= 10; i++) {
  if (i % 2 === 0) {
    sum += i
  }
}
return { action: 'done', value: sum }
`
    const result2 = await runAsyncFunction({}, code2)
    if (result2.success && result2.return_value?.value === 30) {
      console.log('✅ Loops work:', result2.return_value?.value)
    } else {
      console.log('❌ Loops failed:', result2)
    }
  } catch (err: any) {
    console.log('❌ Error:', err.message)
  }

  // Test 3: README example
  console.log('\nTest 3: Complex logic (README example)')
  try {
    const code3 = `
let sum = 0
for (let i = 14; i <= 1078; i++) {
  if (i % 3 === 0 || i % 9 === 0 || i % 5 === 0) {
    sum += i
  }
}
return { action: 'done', value: { success: true, result: sum } }
`
    const result3 = await runAsyncFunction({}, code3)
    if (result3.success && result3.return_value?.value?.result === 271575) {
      console.log('✅ Complex logic works:', result3.return_value?.value?.result)
    } else {
      console.log('❌ Complex logic failed:', result3)
    }
  } catch (err: any) {
    console.log('❌ Error:', err.message)
  }

  console.log('\n🎉 QuickJS driver integration test complete!')
}

main().catch(console.error)
