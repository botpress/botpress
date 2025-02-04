import { describe, it, expect, afterAll, beforeEach, afterEach } from 'vitest'
import { BotpressDocumentation, getClient, getZai, metadata } from './utils'
import { TableAdapter } from '../src/adapters/botpress-table'

describe('zai.check', { timeout: 60_000 }, () => {
  const zai = getZai()

  it('basic check on a string', async () => {
    const value = await zai.check('This text is very clearly written in English.', 'is an english sentence')
    expect(value).toBe(true)
  })

  it('text that is too long gets truncated', async () => {
    const isBotpressDocumentation = await zai.check(
      BotpressDocumentation,
      'is about botpress and looks like documentation'
    )

    const isAboutBirds = await zai.check(BotpressDocumentation, 'is a book about birds and their species')

    expect(isBotpressDocumentation).toBe(true)
    expect(isAboutBirds).toBe(false)
  })

  it('works with any input type', async () => {
    const sly = { name: 'Sylvain Perron', age: 30, job: 'CEO', company: 'Botpress', location: 'Quebec' }
    const american = await zai.check(sly, 'person lives in north america')
    const european = await zai.check(sly, 'person lives in europe')

    expect(american).toBe(true)
    expect(european).toBe(false)
  })

  it('check with examples', async () => {
    const examples = [
      {
        input: 'Rasa (framework)',
        check: true,
        reason: 'Rasa is a chatbot framework, so it competes with us (Botpress).',
      },
      {
        input: 'Rasa (coffee company)',
        check: false,
        reason:
          'Rasa (coffee company) is not in the chatbot or AI agent industry, therefore it does not compete with us (Botpress).',
      },
      {
        input: 'Dialogflow',
        check: true,
        reason: 'Dialogflow is a chatbot development product, so it competes with us (Botpress).',
      },
    ]

    const moveworks = await zai.check('Moveworks', 'competes with us', { examples })
    const ada = await zai.check('Ada.cx', 'competes with us', { examples })
    const voiceflow = await zai.check('Voiceflow', 'competes with us', { examples })
    const nike = await zai.check('Nike', 'competes with us', { examples })
    const adidas = await zai.check('Adidas', 'competes with us', { examples })

    expect(moveworks).toBe(true)
    expect(ada).toBe(true)
    expect(voiceflow).toBe(true)

    expect(nike).toBe(false)
    expect(adidas).toBe(false)
  })
})

describe('zai.learn.check', { timeout: 60_000 }, () => {
  const client = getClient()
  let tableName = 'ZaiTestCheckInternalTable'
  let taskId = 'check'
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

  it('learns a contradiction from examples', async () => {
    const adapter = new TableAdapter({
      client,
      tableName,
    })

    const value = await zai.learn(taskId).check(`What's up`, 'is a greeting')
    expect(value).toBe(true)

    let rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBe(1)
    expect(rows.rows[0].output.value).toEqual(value)

    await adapter.saveExample({
      key: 't1',
      taskId: `zai/${taskId}`,
      taskType: 'zai.check',
      instructions: 'is a greeting',
      input: 'what is up',
      output: false,
      explanation: `"What's up" is our business scenario is NOT considered an official greeting.`,
      metadata,
      status: 'approved',
    })

    await adapter.saveExample({
      key: 't2',
      taskId: `zai/${taskId}`,
      taskType: 'zai.check',
      instructions: 'is a greeting',
      input: 'hello! how are you?',
      output: true,
      explanation: `"hello!" is a common greeting in English.`,
      metadata,
      status: 'approved',
    })

    await adapter.saveExample({
      key: 't3',
      taskId: `zai/${taskId}`,
      taskType: 'zai.check',
      instructions: 'is a greeting',
      input: 'wassup',
      output: false,
      explanation: `"wassup" is a slang term and not considered a formal greeting. It is therefore NOT considered a greeting.`,
      metadata,
      status: 'approved',
    })

    const second = await zai.learn(taskId).check(`What's up`, 'is a greeting')
    expect(second).toBe(false)

    rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBe(4)
    expect(rows.rows[0].output.value).toEqual(second)
  })
})
