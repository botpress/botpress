import { describe, it, expect, afterAll, beforeEach, afterEach, vi } from 'vitest'

import { getClient, getZai } from './utils'

import { check } from '@botpress/vai'
import { Client } from '@botpress/client'

describe('zai.learn / generic', { timeout: 60_000 }, () => {
  const client = getClient()
  let tableName = 'ZaiTestInternalTable'
  let taskId = 'test'
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

  it('saves examples to tables', async () => {
    const value = await zai
      .learn(taskId)
      .check('This text is very clearly written in English.', 'is an english sentence')

    const { rows } = await client.findTableRows({ table: tableName })

    expect(value).toBe(true)
    expect(rows.length).toBe(1)

    check(rows[0].explanation, 'is an explanation sentence')
    expect(rows[0].explanation).not.toContain('Final Answer:')
    expect(rows[0].output).toMatchObject({ value: true })
    expect(rows[0].input).toMatchInlineSnapshot(`
      {
        "value": "This text is very clearly written in English.",
      }
    `)
    expect(rows[0].taskId).toEqual('zai/test')
    expect(rows[0].taskType).toBe('zai.check')
  })

  it('works even if tables are down', async () => {
    const upsertTableRows = vi.fn(async () => {
      throw new Error('Table is down')
    })

    const findTableRows = vi.fn(async () => {
      throw new Error('Table is down')
    })

    const client = {
      ...getClient(),
      findTableRows,
      upsertTableRows,
    } as unknown as Client

    const value = await zai
      .with({ client })
      .learn(taskId)
      .check('This text is very clearly written in English.', 'is an english sentence')

    const { rows } = await getClient().findTableRows({ table: tableName })

    expect(value).toBe(true)
    expect(rows.length).toBe(0)
    expect(upsertTableRows).toHaveBeenCalledTimes(1)
    expect(findTableRows).toHaveBeenCalledTimes(1)
  })
})
