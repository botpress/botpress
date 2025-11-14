#!/usr/bin/env tsx
/**
 * QuickJS Async/Await and Generator Function Tests
 * Critical for Phase 1 validation - these are core LLMz features
 */

import { getQuickJS } from 'quickjs-emscripten'

async function main() {
  console.log('🔬 QuickJS Async/Await & Generator Tests\n')
  console.log('=' .repeat(60))

  const QuickJS = await getQuickJS()
  const runtime = QuickJS.newRuntime()
  runtime.setMemoryLimit(128 * 1024 * 1024)
  const vm = runtime.newContext()

  let passedTests = 0
  let failedTests = 0

  const runTest = async (name: string, testFn: () => Promise<void>) => {
    try {
      await testFn()
      console.log(`✅ ${name}`)
      passedTests++
    } catch (error: any) {
      console.log(`❌ ${name}`)
      console.log(`   Error: ${error.message}`)
      if (error.stack) {
        console.log(`   ${error.stack.split('\n').slice(1, 3).join('\n   ')}`)
      }
      failedTests++
    }
  }

  try {
    // ============================================================
    // ASYNC/AWAIT TESTS
    // ============================================================
    console.log('\n📦 Async/Await Tests')
    console.log('-'.repeat(60))

    await runTest('Test 1: Basic async function', async () => {
      const code = `
async function test() {
  return 42
}
test()
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const promiseResult = await vm.resolvePromise(unwrapped)

      if (!promiseResult.value) throw new Error('No promise value')
      const value = vm.dump(promiseResult.value)
      promiseResult.value.dispose()

      if (value !== 42) throw new Error(`Expected 42, got ${value}`)
    })

    await runTest('Test 2: Async function with await', async () => {
      const code = `
async function getValue() {
  return Promise.resolve('done')
}

async function test() {
  const result = await getValue()
  return result
}
test()
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const promiseResult = await vm.resolvePromise(unwrapped)

      if (!promiseResult.value) throw new Error('No promise value')
      const value = vm.dump(promiseResult.value)
      promiseResult.value.dispose()

      if (value !== 'done') throw new Error(`Expected 'done', got ${value}`)
    })

    await runTest('Test 3: Multiple awaits in sequence', async () => {
      const code = `
async function getValue(n) {
  return Promise.resolve(n)
}

async function test() {
  const a = await getValue(10)
  const b = await getValue(20)
  const c = await getValue(30)
  return a + b + c
}
test()
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const promiseResult = await vm.resolvePromise(unwrapped)

      if (!promiseResult.value) throw new Error('No promise value')
      const value = vm.dump(promiseResult.value)
      promiseResult.value.dispose()

      if (value !== 60) throw new Error(`Expected 60, got ${value}`)
    })

    await runTest('Test 4: Async function with loops', async () => {
      const code = `
async function test() {
  let sum = 0
  for (let i = 1; i <= 5; i++) {
    await Promise.resolve()
    sum += i
  }
  return sum
}
test()
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const promiseResult = await vm.resolvePromise(unwrapped)

      if (!promiseResult.value) throw new Error('No promise value')
      const value = vm.dump(promiseResult.value)
      promiseResult.value.dispose()

      if (value !== 15) throw new Error(`Expected 15, got ${value}`)
    })

    await runTest('Test 5: Async error handling', async () => {
      const code = `
async function test() {
  throw new Error('Async error')
}
test()
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const promiseResult = await vm.resolvePromise(unwrapped)

      if (!promiseResult.error) throw new Error('Expected error')
      const error = vm.dump(promiseResult.error)
      promiseResult.error.dispose()

      if (!error?.message?.includes('Async error')) {
        throw new Error(`Expected 'Async error', got ${error?.message}`)
      }
    })

    // ============================================================
    // GENERATOR FUNCTION TESTS
    // ============================================================
    console.log('\n🔄 Generator Function Tests')
    console.log('-'.repeat(60))

    await runTest('Test 6: Basic generator function', async () => {
      const code = `
function* gen() {
  yield 1
  yield 2
  yield 3
}

const g = gen()
const results = []
results.push(g.next().value)
results.push(g.next().value)
results.push(g.next().value)
results
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const value = vm.dump(unwrapped)
      unwrapped.dispose()

      if (!Array.isArray(value) || value.length !== 3) {
        throw new Error(`Expected [1,2,3], got ${JSON.stringify(value)}`)
      }
      if (value[0] !== 1 || value[1] !== 2 || value[2] !== 3) {
        throw new Error(`Expected [1,2,3], got ${JSON.stringify(value)}`)
      }
    })

    await runTest('Test 7: Generator with loop', async () => {
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
        throw new Error(`Expected [1,2,3,4,5], got ${JSON.stringify(value)}`)
      }
    })

    await runTest('Test 8: Generator with return value', async () => {
      const code = `
function* gen() {
  yield 1
  yield 2
  return 'done'
}

const g = gen()
const results = []
let result
do {
  result = g.next()
  results.push(result.value)
} while (!result.done)
results
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const value = vm.dump(unwrapped)
      unwrapped.dispose()

      if (!Array.isArray(value) || value.length !== 3) {
        throw new Error(`Expected 3 values, got ${JSON.stringify(value)}`)
      }
      if (value[2] !== 'done') {
        throw new Error(`Expected 'done', got ${value[2]}`)
      }
    })

    // ============================================================
    // ASYNC GENERATOR TESTS (CRITICAL FOR CHAT MODE)
    // ============================================================
    console.log('\n🚀 Async Generator Tests (Critical for Chat Mode)')
    console.log('-'.repeat(60))

    await runTest('Test 9: Basic async generator', async () => {
      const code = `
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
test()
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const promiseResult = await vm.resolvePromise(unwrapped)

      if (!promiseResult.value) throw new Error('No promise value')
      const value = vm.dump(promiseResult.value)
      promiseResult.value.dispose()

      if (!Array.isArray(value) || value.length !== 3) {
        throw new Error(`Expected [1,2,3], got ${JSON.stringify(value)}`)
      }
    })

    await runTest('Test 10: Async generator with manual iteration', async () => {
      const code = `
async function* asyncGen() {
  yield 1
  yield 2
  yield 3
}

async function test() {
  const gen = asyncGen()
  const results = []

  let result = await gen.next()
  while (!result.done) {
    results.push(result.value)
    result = await gen.next()
  }

  return results
}
test()
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const promiseResult = await vm.resolvePromise(unwrapped)

      if (!promiseResult.value) throw new Error('No promise value')
      const value = vm.dump(promiseResult.value)
      promiseResult.value.dispose()

      if (!Array.isArray(value) || value.length !== 3) {
        throw new Error(`Expected [1,2,3], got ${JSON.stringify(value)}`)
      }
    })

    await runTest('Test 11: Async generator with async operations', async () => {
      const code = `
async function fetchData(id) {
  return Promise.resolve({ id, data: 'item-' + id })
}

async function* dataStream(ids) {
  for (const id of ids) {
    const data = await fetchData(id)
    yield data
  }
}

async function test() {
  const results = []
  for await (const item of dataStream([1, 2, 3])) {
    results.push(item)
  }
  return results
}
test()
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const promiseResult = await vm.resolvePromise(unwrapped)

      if (!promiseResult.value) throw new Error('No promise value')
      const value = vm.dump(promiseResult.value)
      promiseResult.value.dispose()

      if (!Array.isArray(value) || value.length !== 3) {
        throw new Error(`Expected 3 items, got ${JSON.stringify(value)}`)
      }
      if (value[0].id !== 1 || value[0].data !== 'item-1') {
        throw new Error(`Unexpected data structure: ${JSON.stringify(value[0])}`)
      }
    })

    await runTest('Test 12: LLMz-style async generator pattern', async () => {
      // This mimics the actual pattern used in LLMz vm.ts
      const code = `
async function* __fn__() {
  // Simulate tool calls
  const result1 = await Promise.resolve(10)

  // Simulate yielding a component
  yield { type: 'Message', props: { text: 'Hello' } }

  const result2 = await Promise.resolve(20)

  // Simulate yielding another component
  yield { type: 'Button', props: { label: 'Click me' } }

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

  return {
    yielded: yielded,
    final: result.value
  }
}
test()
`
      const result = vm.evalCode(code)
      const unwrapped = vm.unwrapResult(result)
      const promiseResult = await vm.resolvePromise(unwrapped)

      if (!promiseResult.value) throw new Error('No promise value')
      const value = vm.dump(promiseResult.value)
      promiseResult.value.dispose()

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
    console.log(`✅ Passed: ${passedTests}`)
    console.log(`❌ Failed: ${failedTests}`)
    console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`)

    console.log('\n🎯 Key Findings:')
    if (passedTests >= 12) {
      console.log('  ✅ Async/await fully supported')
      console.log('  ✅ Generator functions work correctly')
      console.log('  ✅ Async generators work (CRITICAL for chat mode)')
      console.log('  ✅ LLMz async generator pattern validated')
      console.log('\n  🚀 QuickJS is READY for LLMz implementation!')
    } else {
      console.log('  ⚠️  Some async/generator features may not work')
      console.log('  ⚠️  Review failed tests before proceeding to Phase 2')
    }

    if (failedTests > 0) {
      console.log('\n⚠️  BLOCKERS IDENTIFIED - Review failures before Phase 2')
    } else {
      console.log('\n✨ NO BLOCKERS - Proceed to Phase 2 with confidence!')
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
