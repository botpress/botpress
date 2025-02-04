import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'

import { BotpressDocumentation, getClient, getZai, metadata } from './utils'

import { z } from '@bpinternal/zui'
import { check } from '@botpress/vai'

import { TableAdapter } from '../src/adapters/botpress-table'

describe('zai.extract', () => {
  const zai = getZai()

  it('extract simple object from paragraph', async () => {
    const person = await zai.extract(
      'My name is John Doe, I am 30 years old and I live in Quebec',
      z.object({
        name: z.string(),
        age: z.number(),
        location: z.string(),
      })
    )

    expect(person).toMatchInlineSnapshot(`
      {
        "age": 30,
        "location": "Quebec",
        "name": "John Doe",
      }
    `)
  })

  it('extract an array of objects from paragraph', async () => {
    const people = await zai.extract(
      `
      My name is John Doe, I am 30 years old and I live in Quebec.
      My name is Jane Doe, I am 25 years old and I live in Montreal.
      His name is Jack Doe, he is 35 years old and he lives in Toronto.
      Her name is Jill Doe, she is 40 years old and she lives in Vancouver.`,
      z.array(
        z.object({
          name: z.string(),
          age: z.number(),
          location: z.string(),
        })
      )
    )

    expect(people).toMatchInlineSnapshot(`
      [
        {
          "age": 30,
          "location": "Quebec",
          "name": "John Doe",
        },
        {
          "age": 25,
          "location": "Montreal",
          "name": "Jane Doe",
        },
        {
          "age": 35,
          "location": "Toronto",
          "name": "Jack Doe",
        },
        {
          "age": 40,
          "location": "Vancouver",
          "name": "Jill Doe",
        },
      ]
    `)
  })

  it('extract an object from anything as input', async () => {
    const person = await zai.extract(
      {
        person: { first: 'John', last: 'Doe', age: 30 },
      },
      z.object({
        a: z.string().describe('The full name of the person in the text'),
        b: z.number().describe('The age of the person in the text'),
      })
    )

    expect(person).toMatchInlineSnapshot(`
      {
        "a": "John Doe",
        "b": 30,
      }
    `)
  })

  it('extract an array of objects from a super long text', async () => {
    const features = await zai.extract(
      BotpressDocumentation,
      z.array(
        z
          .object({
            feature: z.string().describe('The name of the feature'),
            parent: z.string().optional().describe('The parent feature').nullable(),
            description: z.string().describe('The description of the feature'),
          })
          .describe('A feature of Botpress')
      ),
      {
        instructions:
          'Extract all things that looks like a Botpress feature in the provided input. You must extract a minimum of one element.',
      }
    )

    check(features, 'Contains an element about flows / workflows').toBe(true)
    check(features, 'Contains an element about tables').toBe(true)
    check(features, 'Contains an element about webchat').toBe(true)
    check(features, 'Contains an element about integrations').toBe(true)
    check(features, 'Contains an element about HITL (human in the loop)').toBe(true)
    check(features, 'Contains an element about knowledge bases (KB) or Files API').toBe(true)
  })
})

describe('zai.learn.extract', () => {
  const client = getClient()
  let tableName = 'ZaiTestExtractInternalTable'
  let taskId = 'extract'
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

  it('learns a extraction format from examples', async () => {
    const adapter = new TableAdapter({
      client,
      tableName,
    })

    const value = await zai.learn(taskId).extract(
      `I really liked Casino Royale`,
      z.object({
        name: z.string(),
        movie: z.string(),
      }),
      { instructions: 'extract the name of the movie and name of the main character' }
    )

    check(value, 'extracted james bond and casino royale').toBe(true)
    check(value, 'the values are NOT IN ALL CAPS').toBe(true)

    let rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBe(1)

    await adapter.saveExample({
      key: 't1',
      taskId: `zai/${taskId}`,
      taskType: 'zai.extract',
      instructions: 'extract name of movie and main character',
      input: `I went to see the Titanic yesterday and I fell asleep`,
      output: { name: 'JACK DAWSON', movie: 'TITANIC' },
      metadata,
      status: 'approved',
    })

    await adapter.saveExample({
      key: 't2',
      taskId: `zai/${taskId}`,
      taskType: 'zai.extract',
      instructions: 'extract name of movie and main character',
      input: `Did you know that the gladiator movie has a lot of fighting scenes?`,
      output: { name: 'MAXIMUS DECIMUS MERIDIUS', movie: 'GLADIATOR' },
      metadata,
      status: 'approved',
    })

    const second = await zai.learn(taskId).extract(
      `I really liked Casino Royale`,
      z.object({
        name: z.string(),
        movie: z.string(),
      }),
      { instructions: 'extract the name of the movie and name of the main character' }
    )

    expect(second).toMatchInlineSnapshot(`
      {
        "movie": "CASINO ROYALE",
        "name": "JAMES BOND",
      }
    `)

    rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBe(3)
    expect(rows.rows[0].output.value).toMatchObject(second)
  })
})
