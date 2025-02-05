import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'

import { BotpressDocumentation, getClient, getZai, metadata } from './utils'
import { TableAdapter } from '../src/adapters/botpress-table'
import { check } from '@botpress/vai'

describe('zai.label', { timeout: 60_000 }, () => {
  const zai = getZai()

  it('simple labels on small text', async () => {
    const labels = await zai.label(
      {
        name: 'John',
        story: ['John donated to charity last month.', 'John is loved by his community.'],
        criminal_record: 'John has no criminal record.',
      },
      {
        is_human: 'is the person a human?',
        good_person: 'is the person a good person?',
        bad_person: 'is the person a bad person?',
        is_criminal: 'is the person a criminal?',
      }
    )

    expect(labels).toMatchInlineSnapshot(`
      {
        "bad_person": false,
        "good_person": true,
        "is_criminal": false,
        "is_human": true,
      }
    `)
  })

  it('simple labels with example', async () => {
    const labels = {
      is_human: 'is the person a human?',
      good_person: 'is the person a good person?',
      bad_person: 'is the person a bad person?',
      canadian: 'is the person canadian?',
      is_french: 'is the person french?',
    }

    const initial = await zai.label(`Sylvain Perron has no criminal record.`, labels)

    expect(initial.canadian).toBe(false)
    expect(initial.is_french).toBe(false)
    expect(initial.bad_person).toBe(false)
    expect(initial.is_human).toBe(true)

    const second = await zai.label(`Sylvain Perron has no criminal record.`, labels, {
      examples: [
        {
          input: 'Sylvain Pellerin has no criminal record.',
          labels: {
            is_french: {
              label: 'ABSOLUTELY_YES',
              explanation: 'Important: Sylvain Pellerin is a common French name.',
            },
            canadian: {
              label: 'ABSOLUTELY_YES',
              explanation: 'Important: We assume all person named Sylvain are Canadian (business rule).',
            },
          },
        },
        {
          input: 'Sylvain Bouchard is a criminal.',
          labels: {
            bad_person: {
              label: 'PROBABLY_YES',
              explanation: 'Important: Sylvain Bouchard is a criminal, so probably a bad person.',
            },
            is_french: {
              label: 'ABSOLUTELY_YES',
              explanation: 'Important: Sylvain is a common French name.',
            },
            canadian: {
              label: 'ABSOLUTELY_YES',
              explanation: 'Important: We assume all person named Sylvain are Canadian (business rule).',
            },
          },
        },
      ],
    })

    expect(second.canadian).toBe(true)
    expect(second.is_french).toBe(true)
    expect(second.is_human).toBe(true)
    expect(second.bad_person).toBe(false)
  })

  it('label a huge text', async () => {
    const labels = await zai.label(BotpressDocumentation, {
      is_about_animals: 'is the text about animals?',
      contains_lua_code: 'does the text contain Lua code?',
      contains_python_code: 'does the text contain Python code?',
      contains_js_code: 'does the text contain JavaScript code?',
      is_botpress: 'is the text about Botpress?',
      is_rasa: 'is the text about Rasa?',
      has_flows: 'does the text mention flows?',
      has_api: 'does the text mention the Botpress API?',
      has_enterprise: 'does the text mention Botpress Enterprise?',
      has_workspaces: 'does the text mention workspaces?',
      has_webchat: 'does the text mention the Webchat?',
      has_hitl: 'does the text mention HITL (human in the loop)?',
    })

    expect(labels).toMatchInlineSnapshot(`
      {
        "contains_js_code": true,
        "contains_lua_code": false,
        "contains_python_code": false,
        "has_api": true,
        "has_enterprise": true,
        "has_flows": true,
        "has_hitl": true,
        "has_webchat": true,
        "has_workspaces": true,
        "is_about_animals": false,
        "is_botpress": true,
        "is_rasa": false,
      }
    `)
  })
})

describe('zai.learn.label', { timeout: 60_000 }, () => {
  const client = getClient()
  let tableName = 'ZaiTestLabelInternalTable'
  let taskId = 'label'
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

  it('learns a labelling rule from examples', async () => {
    const adapter = new TableAdapter({
      client,
      tableName,
    })

    const value = await zai.learn(taskId).label(`Sylvain Perron has no criminal record.`, {
      is_human: 'is the person a human?',
      good_person: 'is the person a good person?',
      bad_person: 'is the person a bad person?',
      canadian: 'is the person canadian?',
      is_french: 'is the person french?',
    })

    expect(value.is_human).toBe(true)
    expect(value.is_french).toBe(false)
    expect(value.canadian).toBe(false)

    let rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBe(1)

    await adapter.saveExample({
      key: 't1',
      taskId: `zai/${taskId}`,
      taskType: 'zai.label',
      instructions: 'label the sentence',
      input: 'Sylvain Pellerin has no criminal record.',
      output: {
        is_french: {
          label: 'ABSOLUTELY_YES',
          explanation: 'Important: Sylvain is a common French name.',
        },
        canadian: {
          label: 'ABSOLUTELY_YES',
          explanation: 'Since we are doing business only in Canada, we assume all users are Canadians.',
        },
      },
      // The below doesn't make sense on purpose, it's just to test the influence of the explanation on the next prediction
      explanation: `IMPORTANT: Sylvain is a common French name and since we're doing business only in Canada, we assume ALL users are Canadians as soon as they mention a French name.`,
      metadata,
      status: 'approved',
    })

    await adapter.saveExample({
      key: 't2',
      taskId: `zai/${taskId}`,
      taskType: 'zai.label',
      instructions: 'label the sentence',
      input: 'Joannie Côté has a dog.',
      output: {
        is_french: {
          label: 'ABSOLUTELY_YES',
          explanation: 'Important: Joannie is a common French name and Côté is a common French last name.',
        },
        canadian: {
          label: 'ABSOLUTELY_YES',
          explanation: 'Since we are doing business only in Canada, we assume all users are Canadians.',
        },
      },
      metadata,
      status: 'approved',
    })

    rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBe(3)

    const second = await zai.learn(taskId).label(`Sylvain Perron has no criminal record.`, {
      is_human: 'is the person a human?',
      good_person: 'is the person a good person?',
      bad_person: 'is the person a bad person?',
      canadian: 'is the person canadian?',
      is_french: 'is the person french?',
    })

    expect(second.is_human).toBe(true)
    expect(second.is_french).toBe(true)
    expect(second.canadian).toBe(true)

    rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBe(3)

    check(rows.rows[0].output.value.canadian, 'label is positive (yes) and there is an explanation of why').toBe(true)
    check(rows.rows[0].output.value.is_french, 'label is positive (yes) and there is an explanation of why').toBe(true)
  })
})
