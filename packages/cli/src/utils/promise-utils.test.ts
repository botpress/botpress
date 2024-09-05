import { test, expect } from 'vitest'
import { awaitRecord } from './promise-utils'

test('awaitRecord', async () => {
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const record = {
    a: sleep(30).then(() => 'a'),
    b: sleep(20).then(() => 'b'),
    c: sleep(10).then(() => 'c'),
  }
  const result = await awaitRecord(record)
  expect(result).toEqual({ a: 'a', b: 'b', c: 'c' })
})
