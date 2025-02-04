import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { check } from '@botpress/vai'

import { getClient, getZai, metadata, tokenizer } from './utils'
import { TableAdapter } from '../src/adapters/botpress-table'

const Zoe = `
Part 1. Zoe walks to the park.
Part 2. She meets her friend.
Part 3. They play together.
Part 4. They have a picnic.
Part 5. They go home.
`.trim()

describe('zai.rewrite', { timeout: 60_000 }, () => {
  const zai = getZai()

  it('transforms text to all caps', async () => {
    const result = await zai.rewrite(`Hello, what is the time today?`, 'write in all caps')
    expect(result).toBe(`HELLO, WHAT IS THE TIME TODAY?`)
  })

  it('transforms text to all caps and respects tokens restrictions', async () => {
    const result = await zai.rewrite(Zoe, 'write in all caps', { length: 15 })
    expect(tokenizer.count(result)).toBeLessThanOrEqual(20)
    expect(result).toContain(`PART 1. ZOE WALKS TO THE PARK`)
    expect(result).not.toContain(`PART 3`)
  })

  it('french translation of the story', async () => {
    const result = await zai.rewrite(Zoe, 'translate to french')
    check(result, 'is a french story about Zeo and with 5 parts').toBe(true)
  })

  it('Throws if input is bigger than the model max tokens', async () => {
    await expect(zai.rewrite(Zoe.repeat(100_000), 'translate to french')).rejects.toThrow(/tokens/i)
  })
})

describe('zai.learn.rewrite', { timeout: 60_000 }, () => {
  const client = getClient()
  let tableName = 'ZaiTestRewriteInternalTable'
  let taskId = 'rewrite'
  let zai = getZai()

  beforeEach(async () => {
    zai = getZai().with({
      activeLearning: {
        enable: true,
        taskId,
        tableName,
      },
    })
  })

  afterEach(async () => {
    try {
      await client.deleteTableRows({ table: tableName, deleteAllRows: true })
    } catch (err) {}
  })

  afterAll(async () => {
    try {
      await client.deleteTable({ table: tableName })
    } catch (err) {}
  })

  it('learns rewrite rules from examples', async () => {
    const adapter = new TableAdapter({
      client,
      tableName,
    })

    const value = await zai.learn(taskId).rewrite(`Botpress is awesome`, 'write it like we want it')

    check(value, `The text means more or less the same as "Botpress is awesome" but slightly different`).toBe(true)

    let rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBe(1)
    expect(rows.rows[0].output.value).toBe(value)

    await adapter.saveExample({
      key: 't1',
      taskId: `zai/${taskId}`,
      taskType: 'zai.rewrite',
      instructions: 'write it like we want it',
      input: 'Microsoft is a big company',
      output: `# MICROSOFT IS A BIG COMPANY`,
      metadata,
      status: 'approved',
    })

    await adapter.saveExample({
      key: 't2',
      taskId: `zai/${taskId}`,
      taskType: 'zai.rewrite',
      instructions: 'write it like we want it',
      input: 'Google is an evil company',
      output: `# GOOGLE IS AN EVIL COMPANY`,
      metadata,
      status: 'approved',
    })

    const second = await zai.learn(taskId).rewrite(`Botpress is awesome`, 'write it like we want it')

    rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBe(3)

    check(second, `The text is "BOTPRESS IS AWESOME" and starts with a hashtag`).toBe(true)

    expect(rows.rows.length).toBe(3)
    expect(rows.rows[0].output.value).toBe(second)
  })
})
