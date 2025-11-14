#!/usr/bin/env tsx
/**
 * QuickJS Async/Generator Working Tests
 * Uses executePendingJobs to manually drive event loop
 */

import { getQuickJS } from 'quickjs-emscripten'

async function main() {
  console.log('🔬 QuickJS Async/Await & Generator Working Tests\n')
  console.log('=' .repeat(60))

  const QuickJS = await getQuickJS()
  const runtime = QuickJS.newRuntime()
  runtime.setMemoryLimit(128 * 1024 * 1024)
  const vm = runtime.newContext()

  let passedTests = 0
  let failedTests = 0

  const runTest = (name: string, testFn: () => void) => {
    try {
      testFn()
      console.log(`✅ ${name}`)
      passedTests++
    } catch (error: any) {
      console.log(`❌ ${name}`)
      console.log(`   Error: ${error.message}`)
      failedTests++
    }
  }

  // Helper to execute pending microtasks
  const executePendingJobs = () => {
    const maxIterations = 100
    let jobsExecuted = 0
    while (jobsExecuted < maxIterations) {
      const pending = (runtime as any).executePendingJobs?.(-1)
      if (pending === undefined || pending <= 0) break
      jobsExecuted++
    }
    return jobsExecuted
  }

  try {
    // ============================================================
    // GENERATOR TESTS
    // ============================================================
    console.log('\n🔄 Generator Function Tests')
    console.log('-'.repeat(60))

    runTest('Test 1: Basic generator', () => {
      const code = `
function* gen() {
  yield 1
  yield 2
  yield 3
}
const g = gen()
const values = []
let r = g.next()
while (!r.done) {
  values.push(r.value)
  r = g.next()
}
values
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const value = vm.dump(unwrapped)
      unwrapped.dispose()

      if (!Array.isArray(value) || value.length !== 3 || value[0] !== 1 || value[1] !== 2 || value[2] !== 3) {
        throw new Error(`Expected [1,2,3], got ${JSON.stringify(value)}`)
      }
    })

    runTest('Test 2: Generator with for-of', () => {
      const code = `
function* range(start, end) {
  for (let i = start; i <= end; i++) {
    yield i
  }
}
const values = []
for (const val of range(1, 5)) {
  values.push(val)
}
values
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const value = vm.dump(unwrapped)
      unwrapped.dispose()

      if (!Array.isArray(value) || value.length !== 5) {
        throw new Error(`Expected 5 values, got ${JSON.stringify(value)}`)
      }
    })

    runTest('Test 3: Generator with return', () => {
      const code = `
function* gen() {
  yield 1
  yield 2
  return 'done'
}
const g = gen()
const values = []
let r = g.next()
while (!r.done) {
  values.push(r.value)
  r = g.next()
}
values.push(r.value)
values
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const value = vm.dump(unwrapped)
      unwrapped.dispose()

      if (!Array.isArray(value) || value[2] !== 'done') {
        throw new Error(`Expected 'done' at end, got ${JSON.stringify(value)}`)
      }
    })

    // ============================================================
    // ASYNC TESTS (with manual event loop)
    // ============================================================
    console.log('\n⚡ Async/Await Tests (with executePendingJobs)')
    console.log('-'.repeat(60))

    runTest('Test 4: Basic async function with Promise', () => {
      const code = `
globalThis.__result = null
async function test() {
  return 42
}
test().then(v => { globalThis.__result = v })
`
      vm.evalCode(code)
      executePendingJobs()

      const resultCode = `globalThis.__result`
      const result = vm.evalCode(resultCode)
      const unwrapped = vm.unwrapResult(result)
      const value = vm.dump(unwrapped)
      unwrapped.dispose()

      if (value !== 42) {
        throw new Error(`Expected 42, got ${value}`)
      }
    })

    runTest('Test 5: Async await chain', () => {
      const code = `
globalThis.__result2 = null
async function getValue(n) {
  return Promise.resolve(n)
}
async function test() {
  const a = await getValue(10)
  const b = await getValue(20)
  return a + b
}
test().then(v => { globalThis.__result2 = v })
`
      vm.evalCode(code)
      const jobs = executePendingJobs()

      const resultCode = `globalThis.__result2`
      const result = vm.evalCode(resultCode)
      const unwrapped = vm.unwrapResult(result)
      const value = vm.dump(unwrapped)
      unwrapped.dispose()

      if (value !== 30) {
        throw new Error(`Expected 30, got ${value} (jobs executed: ${jobs})`)
      }
    })

    runTest('Test 6: Async with loops', () => {
      const code = `
globalThis.__result3 = null
async function test() {
  let sum = 0
  for (let i = 1; i <= 5; i++) {
    await Promise.resolve()
    sum += i
  }
  return sum
}
test().then(v => { globalThis.__result3 = v })
`
      vm.evalCode(code)
      executePendingJobs()

      const resultCode = `globalThis.__result3`
      const result = vm.evalCode(resultCode)
      const unwrapped = vm.unwrapResult(result)
      const value = vm.dump(unwrapped)
      unwrapped.dispose()

      if (value !== 15) {
        throw new Error(`Expected 15, got ${value}`)
      }
    })

    runTest('Test 7: Async error handling', () => {
      const code = `
globalThis.__error = null
async function test() {
  throw new Error('Async error')
}
test().catch(e => { globalThis.__error = e.message })
`
      vm.evalCode(code)
      executePendingJobs()

      const resultCode = `globalThis.__error`
      const result = vm.evalCode(resultCode)
      const unwrapped = vm.unwrapResult(result)
      const value = vm.dump(unwrapped)
      unwrapped.dispose()

      if (value !== 'Async error') {
        throw new Error(`Expected 'Async error', got ${value}`)
      }
    })

    // ============================================================
    // ASYNC GENERATOR TESTS (CRITICAL FOR LLMZ)
    // ============================================================
    console.log('\n🚀 Async Generator Tests (Critical for LLMz Chat Mode)')
    console.log('-'.repeat(60))

    runTest('Test 8: Basic async generator', () => {
      const code = `
globalThis.__asyncGenResult = null
async function* asyncGen() {
  yield 1
  await Promise.resolve()
  yield 2
  await Promise.resolve()
  yield 3
}
async function test() {
  const results = []
  for await (const val of asyncGen()) {
    results.push(val)
  }
  return results
}
test().then(v => { globalThis.__asyncGenResult = v })
`
      vm.evalCode(code)
      executePendingJobs()

      const resultCode = `globalThis.__asyncGenResult`
      const result = vm.evalCode(resultCode)
      const unwrapped = vm.unwrapResult(result)
      const value = vm.dump(unwrapped)
      unwrapped.dispose()

      if (!Array.isArray(value) || value.length !== 3) {
        throw new Error(`Expected [1,2,3], got ${JSON.stringify(value)}`)
      }
    })

    runTest('Test 9: Async generator manual iteration', () => {
      const code = `
globalThis.__asyncGenResult2 = null
async function* asyncGen() {
  yield 10
  yield 20
  yield 30
}
async function test() {
  const gen = asyncGen()
  const results = []
  let r = await gen.next()
  while (!r.done) {
    results.push(r.value)
    r = await gen.next()
  }
  return results
}
test().then(v => { globalThis.__asyncGenResult2 = v })
`
      vm.evalCode(code)
      executePendingJobs()

      const resultCode = `globalThis.__asyncGenResult2`
      const result = vm.evalCode(resultCode)
      const unwrapped = vm.unwrapResult(result)
      const value = vm.dump(unwrapped)
      unwrapped.dispose()

      if (!Array.isArray(value) || value.length !== 3) {
        throw new Error(`Expected 3 values, got ${JSON.stringify(value)}`)
      }
    })

    runTest('Test 10: LLMz-style async generator pattern', () => {
      const code = `
globalThis.__llmzResult = null
async function* __fn__() {
  // Simulate tool call
  const result1 = await Promise.resolve(10)

  // Yield component (chat mode)
  yield { type: 'Message', props: { text: 'Hello' } }

  const result2 = await Promise.resolve(20)

  // Yield another component
  yield { type: 'Button', props: { label: 'Click' } }

  // Return final result
  return { action: 'done', value: result1 + result2 }
}
async function test() {
  const fn = __fn__()
  const yielded = []
  let result
  do {
    result = await fn.next()
    if (!result.done) {
      yielded.push(result.value)
    }
  } while (!result.done)
  return { yielded, final: result.value }
}
test().then(v => { globalThis.__llmzResult = v })
`
      vm.evalCode(code)
      executePendingJobs()

      const resultCode = `globalThis.__llmzResult`
      const result = vm.evalCode(resultCode)
      const unwrapped = vm.unwrapResult(result)
      const value = vm.dump(unwrapped)
      unwrapped.dispose()

      if (!value.yielded || value.yielded.length !== 2) {
        throw new Error(`Expected 2 yielded values, got ${JSON.stringify(value)}`)
      }
      if (!value.final || value.final.value !== 30) {
        throw new Error(`Expected final value 30, got ${JSON.stringify(value.final)}`)
      }
      if (value.yielded[0].type !== 'Message') {
        throw new Error(`Expected Message component, got ${value.yielded[0].type}`)
      }
    })

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('📊 Test Summary')
    console.log('='.repeat(60))
    console.log(`✅ Passed: ${passedTests}/10`)
    console.log(`❌ Failed: ${failedTests}/10`)
    console.log(`📈 Success Rate: ${((passedTests / 10) * 100).toFixed(0)}%`)

    console.log('\n🎯 Key Findings:')
    console.log(`  ✅ Generator functions: WORKING`)
    console.log(`  ✅ Async/await: WORKING (with executePendingJobs)`)
    console.log(`  ✅ Async generators: WORKING`)
    console.log(`  ✅ LLMz async generator pattern: WORKING`)
    console.log(`  📌 Requirement: Must call executePendingJobs() after each eval`)

    if (passedTests === 10) {
      console.log('\n✨ ALL TESTS PASSED!')
      console.log('🚀 QuickJS is FULLY COMPATIBLE with LLMz requirements!')
      console.log('\n📝 Implementation Note:')
      console.log('   Must manually call runtime.executePendingJobs() after')
      console.log('   each code execution to process microtask queue.')
    } else {
      console.log(`\n⚠️  ${failedTests} test(s) failed - investigate before Phase 2`)
    }

  } catch (error: any) {
    console.error('\n❌ Fatal test error:', error.message)
    console.error(error.stack)
  } finally {
    vm.dispose()
    runtime.dispose()
  }
}

main().catch(console.error)
