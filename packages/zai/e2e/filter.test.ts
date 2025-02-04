import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest'

import { getClient, getZai, metadata } from './utils'
import { TableAdapter } from '../src/adapters/botpress-table'
import { Client } from '@botpress/client'

describe('zai.filter', { timeout: 60_000 }, () => {
  let zai = getZai()

  beforeEach(async () => {
    zai = getZai()
  })

  it('basic filter with small items', async () => {
    const value = await zai.filter(
      [
        { name: 'John', description: 'is a bad person' },
        { name: 'Alice', description: 'is a good person' },
        { name: 'Bob', description: 'is a good person' },
        { name: 'Eve', description: 'is a bad person' },
        { name: 'Alex', description: 'is a good person' },
        { name: 'Sara', description: 'donates to charity every month' },
        { name: 'Tom', description: 'commits crimes and is in jail' },
      ],
      'generally good people'
    )

    const names = value.map((v) => v.name)
    expect(names).toMatchInlineSnapshot(`
      [
        "Alice",
        "Bob",
        "Alex",
        "Sara",
      ]
    `)
  })

  it('filtering huge array chunks it up', async () => {
    const callAction = vi.fn()
    const client = { ...getClient(), callAction } as unknown as Client

    zai = getZai().with({
      client,
    })

    const hugeArray = Array.from({ length: 100 }, (_, i) => ({
      name: `Person #${i}#`,
      description: 'blah blah '.repeat(50_000),
    }))

    try {
      await zai.filter(hugeArray, 'generally good people', { tokensPerItem: 100_000 })
    } catch (err) {}

    expect(callAction.mock.calls.length).toBeGreaterThan(20)
    expect(JSON.stringify(callAction.mock.calls.at(0))).toContain('Person #0#')
    expect(JSON.stringify(callAction.mock.calls.at(0))).not.toContain('Person #99#')

    expect(JSON.stringify(callAction.mock.calls.at(-1))).not.toContain('Person #0#')
    expect(JSON.stringify(callAction.mock.calls.at(-1))).toContain('Person #99#')

    callAction.mockReset()

    try {
      await zai.filter(hugeArray, 'generally good people', { tokensPerItem: 100 })
    } catch (err) {}

    expect(callAction.mock.calls.length).toBe(2)
  })

  it('filter with examples', async () => {
    const examples = [
      {
        input: 'Rasa (framework)',
        filter: true,
        reason: 'Rasa is a chatbot framework, so it competes with us (Botpress).',
      },
      {
        input: 'Rasa (coffee company)',
        filter: false,
        reason:
          'Rasa (coffee company) is not in the chatbot or AI agent industry, therefore it does not compete with us (Botpress).',
      },
      {
        input: 'Dialogflow',
        filter: true,
        reason: 'Dialogflow is a chatbot development product, so it competes with us (Botpress).',
      },
    ]

    const value = await zai.filter(
      [{ name: 'Moveworks' }, { name: 'Ada.cx' }, { name: 'Nike' }, { name: 'Voiceflow' }, { name: 'Adidas' }],
      'competes with us',
      { examples }
    )

    const names = value.map((v) => v.name)
    expect(names).toMatchInlineSnapshot(`
      [
        "Moveworks",
        "Ada.cx",
        "Voiceflow",
      ]
    `)
  })
})

describe('zai.learn.filter', { timeout: 60_000 }, () => {
  const client = getClient()
  let tableName = 'ZaiTestFilterInternalTable'
  let taskId = 'filter'
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

  it('learns a filtering rule from examples', async () => {
    const adapter = new TableAdapter({
      client,
      tableName,
    })

    await adapter.saveExample({
      key: 't1',
      taskId: `zai/${taskId}`,
      taskType: 'zai.filter',
      instructions: 'competes with us?',
      input: ['Rasa (framework)', 'Rasa (coffee company)'],
      output: ['Rasa (framework)'],
      explanation: `Rasa is a chatbot framework, so it competes with us (Botpress). We should keep it. Rasa (coffee company) is not in the chatbot or AI agent industry, therefore it does not compete with us (Botpress). We should filter it out.`,
      metadata,
      status: 'approved',
    })

    await adapter.saveExample({
      key: 't2',
      taskId: `zai/${taskId}`,
      taskType: 'zai.filter',
      instructions: 'competes with us?',
      input: ['Voiceflow', 'Dialogflow'],
      output: ['Voiceflow', 'Dialogflow'],
      explanation: `Voiceflow is a chatbot development product, so it competes with us (Botpress). We should keep it. Dialogflow is a chatbot development product, so it competes with us (Botpress). We should keep it.`,
      metadata,
      status: 'approved',
    })

    const second = await zai
      .learn(taskId)
      .filter(['Nike', 'Ada.cx', 'Adidas', 'Moveworks', 'Lululemon'], 'competes with us? (botpress)')

    expect(second).toMatchInlineSnapshot(`
      [
        "Ada.cx",
        "Moveworks",
      ]
    `)

    const rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBe(3)
    expect(rows.rows.at(-1)!.output.value).toEqual(second)
  })
})
