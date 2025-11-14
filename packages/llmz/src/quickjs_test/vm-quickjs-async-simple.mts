#!/usr/bin/env tsx
/**
 * Simplified QuickJS Async Tests
 * Testing if QuickJS supports async/generators at all
 */

import { getQuickJS } from 'quickjs-emscripten'

async function main() {
  console.log('🔬 QuickJS Async/Generator Simple Tests\n')

  const QuickJS = await getQuickJS()
  const runtime = QuickJS.newRuntime()
  const vm = runtime.newContext()

  try {
    // Test 1: Can we even create an async function?
    console.log('Test 1: Async function syntax support')
    try {
      const code1 = `
async function test() {
  return 42
}
typeof test
`
      const result1 = vm.evalCode(code1)
      const unwrapped1 = vm.unwrapResult(result1)
      const value1 = vm.dump(unwrapped1)
      unwrapped1.dispose()
      console.log(`✅ Async function type: ${value1}`)
    } catch (err: any) {
      console.log(`❌ Async functions not supported: ${err.message}`)
    }

    // Test 2: Generator function syntax
    console.log('\nTest 2: Generator function syntax support')
    try {
      const code2 = `
function* test() {
  yield 1
}
typeof test
`
      const result2 = vm.evalCode(code2)
      const unwrapped2 = vm.unwrapResult(result2)
      const value2 = vm.dump(unwrapped2)
      unwrapped2.dispose()
      console.log(`✅ Generator function type: ${value2}`)
    } catch (err: any) {
      console.log(`❌ Generator functions not supported: ${err.message}`)
    }

    // Test 3: Can we create a generator and call next()?
    console.log('\nTest 3: Generator iteration')
    try {
      const code3 = `
function* gen() {
  yield 1
  yield 2
  yield 3
}
const g = gen()
const r1 = g.next()
const r2 = g.next()
[r1.value, r2.value]
`
      const result3 = vm.evalCode(code3)
      const unwrapped3 = vm.unwrapResult(result3)
      const value3 = vm.dump(unwrapped3)
      unwrapped3.dispose()
      console.log(`✅ Generator iteration works: ${JSON.stringify(value3)}`)
    } catch (err: any) {
      console.log(`❌ Generator iteration failed: ${err.message}`)
    }

    // Test 4: Async generator syntax
    console.log('\nTest 4: Async generator syntax support')
    try {
      const code4 = `
async function* test() {
  yield 1
}
typeof test
`
      const result4 = vm.evalCode(code4)
      const unwrapped4 = vm.unwrapResult(result4)
      const value4 = vm.dump(unwrapped4)
      unwrapped4.dispose()
      console.log(`✅ Async generator function type: ${value4}`)
    } catch (err: any) {
      console.log(`❌ Async generators not supported: ${err.message}`)
    }

    // Test 5: Promise creation
    console.log('\nTest 5: Promise support')
    try {
      const code5 = `
const p = new Promise((resolve) => resolve(42))
typeof p
`
      const result5 = vm.evalCode(code5)
      const unwrapped5 = vm.unwrapResult(result5)
      const value5 = vm.dump(unwrapped5)
      unwrapped5.dispose()
      console.log(`✅ Promise type: ${value5}`)
    } catch (err: any) {
      console.log(`❌ Promises not supported: ${err.message}`)
    }

    // Test 6: Try synchronous promise resolution (if possible)
    console.log('\nTest 6: Immediate promise resolution')
    try {
      const code6 = `
let result = null
Promise.resolve(42).then(v => { result = v })
result
`
      const result6 = vm.evalCode(code6)
      const unwrapped6 = vm.unwrapResult(result6)
      const value6 = vm.dump(unwrapped6)
      unwrapped6.dispose()
      console.log(`   Promise result (sync): ${value6}`)
      console.log(`   Note: null means microtask queue not processed`)
    } catch (err: any) {
      console.log(`❌ Promise execution failed: ${err.message}`)
    }

    // Test 7: Can we manually advance with executePendingJobs?
    console.log('\nTest 7: Manual event loop with executePendingJobs')
    try {
      const code7 = `
let result = null
Promise.resolve(42).then(v => { result = v })
result
`
      const result7 = vm.evalCode(code7)
      const unwrapped7 = vm.unwrapResult(result7)

      // Try to run pending jobs
      console.log(`   Before executePendingJobs: ${vm.dump(unwrapped7)}`)

      // Execute pending microtasks
      const maxJobs = 100
      let jobsExecuted = 0
      while ((runtime as any).executePendingJobs?.(-1) > 0 && jobsExecuted++ < maxJobs) {
        // Keep executing until no more jobs
      }

      // Check result again
      const result7b = vm.evalCode('result')
      const unwrapped7b = vm.unwrapResult(result7b)
      console.log(`   After executePendingJobs (${jobsExecuted} jobs): ${vm.dump(unwrapped7b)}`)

      unwrapped7.dispose()
      unwrapped7b.dispose()

      if (jobsExecuted > 0) {
        console.log(`✅ executePendingJobs available - can process microtasks!`)
      } else {
        console.log(`   ⚠️  executePendingJobs not effective or not available`)
      }
    } catch (err: any) {
      console.log(`❌ executePendingJobs failed: ${err.message}`)
    }

    // Test 8: Check runtime capabilities
    console.log('\nTest 8: Runtime capabilities')
    console.log(`   runtime.executePendingJobs: ${typeof (runtime as any).executePendingJobs}`)
    console.log(`   vm.resolvePromise: ${typeof vm.resolvePromise}`)
    console.log(`   QuickJS variant: ${(QuickJS as any).variant || 'unknown'}`)

    console.log('\n' + '='.repeat(60))
    console.log('📊 Summary')
    console.log('='.repeat(60))
    console.log('This test validates what async features QuickJS supports.')
    console.log('If async/generators work but promises hang, we need to')
    console.log('manually drive the event loop with executePendingJobs().')

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    console.error(error.stack)
  } finally {
    vm.dispose()
    runtime.dispose()
  }
}

main().catch(console.error)
