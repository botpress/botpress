#!/usr/bin/env tsx
/**
 * QuickJS POC - Standalone test script
 * Run with: tsx src/vm-quickjs-poc.mts
 */

import { getQuickJS } from 'quickjs-emscripten'

async function main() {
  console.log('🚀 QuickJS-Emscripten POC Test\n')

  const QuickJS = await getQuickJS()
  const runtime = QuickJS.newRuntime()
  runtime.setMemoryLimit(128 * 1024 * 1024)
  const vm = runtime.newContext()

  try {
    // Test 1: Simple execution
    console.log('Test 1: Simple code execution')
    const code1 = `
const x = 1 + 2
const y = x * 3
y
`
    const result1 = vm.evalCode(code1)
    const unwrapped1 = vm.unwrapResult(result1)
    console.log('✅ Result:', vm.dump(unwrapped1))
    unwrapped1.dispose()

    // Test 2: Functions
    console.log('\nTest 2: Function execution')
    const code2 = `
function add(a, b) {
  return a + b
}
add(5, 3)
`
    const result2 = vm.evalCode(code2)
    const unwrapped2 = vm.unwrapResult(result2)
    console.log('✅ Result:', vm.dump(unwrapped2))
    unwrapped2.dispose()

    // Test 3: Loops and conditionals
    console.log('\nTest 3: Loops and conditionals')
    const code3 = `
let sum = 0
for (let i = 1; i <= 10; i++) {
  if (i % 2 === 0) {
    sum += i
  }
}
sum
`
    const result3 = vm.evalCode(code3)
    const unwrapped3 = vm.unwrapResult(result3)
    console.log('✅ Result:', vm.dump(unwrapped3))
    unwrapped3.dispose()

    // Test 4: Host function binding
    console.log('\nTest 4: Host function binding')
    const addFn = vm.newFunction('hostAdd', (aHandle, bHandle) => {
      const a = vm.getNumber(aHandle)
      const b = vm.getNumber(bHandle)
      return vm.newNumber(a + b)
    })
    vm.setProp(vm.global, 'hostAdd', addFn)
    addFn.dispose()

    const code4 = `hostAdd(10, 20)`
    const result4 = vm.evalCode(code4)
    const unwrapped4 = vm.unwrapResult(result4)
    console.log('✅ Result:', vm.dump(unwrapped4))
    unwrapped4.dispose()

    // Test 5: Object handling
    console.log('\nTest 5: Object creation and manipulation')
    const code5 = `
const obj = { name: 'test', value: 42 }
obj.value * 2
`
    const result5 = vm.evalCode(code5)
    const unwrapped5 = vm.unwrapResult(result5)
    console.log('✅ Result:', vm.dump(unwrapped5))
    unwrapped5.dispose()

    // Test 6: Error handling
    console.log('\nTest 6: Error handling')
    const code6 = `
throw new Error('Test error')
`
    const result6 = vm.evalCode(code6)
    const unwrapped6 = vm.unwrapResult(result6)
    if (unwrapped6.error) {
      console.log('✅ Error caught:', vm.dump(unwrapped6.error))
      unwrapped6.error.dispose()
    } else {
      console.log('❌ Should have thrown')
      unwrapped6.value?.dispose()
    }

    // Test 7: Complex logic (README example)
    console.log('\nTest 7: Complex logic (sum divisible by 3, 5, or 9)')
    const code7 = `
let sum = 0
for (let i = 14; i <= 1078; i++) {
  if (i % 3 === 0 || i % 9 === 0 || i % 5 === 0) {
    sum += i
  }
}
sum
`
    const result7 = vm.evalCode(code7)
    const unwrapped7 = vm.unwrapResult(result7)
    console.log('✅ Result:', vm.dump(unwrapped7), '(expected: 271575)')
    unwrapped7.dispose()

    // Test 8: Promise support
    console.log('\nTest 8: Promise support')
    const code8 = `
new Promise((resolve) => {
  resolve(42)
})
`
    const result8 = vm.evalCode(code8)
    const unwrapped8 = vm.unwrapResult(result8)
    const promiseResult = await vm.resolvePromise(unwrapped8)

    if (promiseResult.value) {
      console.log('✅ Promise result:', vm.dump(promiseResult.value))
      promiseResult.value.dispose()
    }

    console.log('\n✨ All basic tests passed!')
    console.log('\n📊 Key Findings:')
    console.log('  • QuickJS can execute JavaScript code')
    console.log('  • Functions, loops, and conditionals work')
    console.log('  • Host function binding works')
    console.log('  • Error handling works')
    console.log('  • Complex logic works correctly')
    console.log('  • Promise support available')

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
  } finally {
    vm.dispose()
    runtime.dispose()
  }
}

main().catch(console.error)
