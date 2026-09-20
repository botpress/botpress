import { describe, expect, it } from 'vitest'
import { getTokenizer } from '../utils.js'
import { Memory, previewMemoryValue } from './memory.js'

const provenance = { id: 'first', number: 1, turn: 1, timestamp: 1000 }

describe('named memory', () => {
  it('bounds previews without clipping stored values', () => {
    const memory = new Memory()
    const entries = Array.from({ length: 100 }, (_, id) => ({ id, detail: 'extensive details '.repeat(100) }))
    const report = memory.assign({ entries }, provenance)
    const preview = previewMemoryValue(entries)

    expect(getTokenizer().count(preview)).toBeLessThanOrEqual(60)
    expect(preview).toContain('[truncated]')
    expect(preview).not.toContain('\n')
    expect(report.created[0]?.preview).toBe(preview)
    expect(memory.render({ turn: 1, now: 1000 })).toContain(preview)
    expect(memory.variables.entries).toEqual(entries)
  })

  it('coalesces writes, refreshes equal assignments, and does not refresh reads', () => {
    const memory = new Memory()
    expect(memory.assign({ age: 42 }, provenance).created.map((change) => change.name)).toEqual(['age'])
    expect(memory.assign({ age: 42 }, { ...provenance, timestamp: 2000 }).updated).toEqual([])

    const report = memory.assign(
      { age: 42 },
      {
        ...provenance,
        variableWrites: [
          { name: 'age', timestamp: 2500 },
          { name: 'age', timestamp: 2900 },
        ],
      }
    )

    expect(report.updated).toHaveLength(1)
    expect(report.updated[0]?.provenance.timestamp).toBe(2900)
  })

  it('keeps partial changes and clears unavailable bindings rather than exposing old values', () => {
    const memory = new Memory({ maxBytes: 4000, variables: { account: 'old' } })
    const report = memory.assign(
      { prefix: 1, unsupported: () => 42, tooBig: 'x'.repeat(5000) },
      {
        ...provenance,
        captureErrors: [{ name: 'account', reason: 'initialization failed' }],
      }
    )

    expect(memory.variables).toEqual({ prefix: 1 })
    expect(report.unavailable.map((item) => item.name)).toEqual(['account', 'unsupported', 'tooBig'])
    expect(() => new Memory({ variables: { $return: 1 } })).toThrow(/reserved/)
  })

  it('serializes bindings and object state without keeping a second execution history', () => {
    const memory = new Memory({ variables: { unset: undefined, negativeZero: -0 } })
    const json = memory.toJSON()
    const restored = Memory.fromJSON(JSON.parse(JSON.stringify(json)))

    expect(json).not.toHaveProperty('iterations')
    expect(json).not.toHaveProperty('latestResultId')
    expect(restored.variables).toHaveProperty('unset', undefined)
    expect(Object.is(restored.variables.negativeZero, -0)).toBe(true)
  })
})

describe('object property memory', () => {
  it('shows exact host properties with schema and mutability without adding mutable variable aliases', async () => {
    const { z } = await import('@bpinternal/zui')
    const memory = new Memory()
    await memory.syncObjects([
      {
        name: 'account',
        properties: [
          {
            name: 'balance',
            value: 42,
            type: z.number(),
            writable: true,
          },
          {
            name: 'plan',
            value: 'pro',
            type: z.enum(['free', 'pro']),
            writable: false,
          },
        ],
      },
    ])
    const overview = memory.render({
      turn: 1,
    })
    expect(overview).toContain('`account.balance`: 42 (number; writable)')
    expect(overview).toContain('read-only')
    expect(overview).toContain('age unknown')
    expect(memory.variables).toEqual({})
    expect(memory.variables).not.toHaveProperty('account')
    expect(() => memory.assertNamesAvailable(['account'])).toThrow(/namespace/)
  })

  it('shows meaningful property schema constraints and persists the full schema', async () => {
    const { z } = await import('@bpinternal/zui')
    const memory = new Memory()
    await memory.syncObjects([
      {
        name: 'account',
        properties: [
          {
            name: 'age',
            value: 42,
            type: z.number().min(18).max(150),
            writable: true,
          },
          {
            name: 'email',
            value: 'sam@example.com',
            type: z.string().email().describe('Primary contact email'),
            writable: false,
          },
          {
            name: 'preferences',
            value: {
              tags: ['news'],
              website: 'https://example.com',
              code: 'ABC',
            },
            type: z.object({
              tags: z.array(z.string().min(2).max(12)).min(1).max(5),
              website: z.string().url(),
              code: z.string().regex(/^[A-Z]{3}$/),
            }),
            writable: true,
          },
        ],
      },
    ])
    const overview = memory.render({ turn: 1 })
    expect(overview).toContain('number [min 18, max 150]; writable')
    expect(overview).toContain('string [email]; read-only')
    expect(overview).toContain('Primary contact email')
    expect(overview).toContain('min length 2, max length 12')
    expect(overview).toContain('min items 1, max items 5')
    expect(overview).toMatch(/website: string \[(uri|url)\]/)
    expect(overview).toContain('pattern "^[A-Z]{3}$"')
    const serialized = memory.serialize()
    expect(serialized.objects?.find((property) => property.property === 'age')?.schema).toMatchObject({
      type: 'number',
      minimum: 18,
      maximum: 150,
    })
    const restored = Memory.restore(JSON.parse(JSON.stringify(serialized)))
    expect(restored.serialize().objects?.map((property) => property.schema)).toEqual(
      serialized.objects?.map((property) => property.schema)
    )
    const changedSerialization = restored.serialize()
    const schema = changedSerialization.objects?.find((property) => property.property === 'age')?.schema
    if (schema && typeof schema === 'object') {
      schema.minimum = 999
    }

    expect(restored.serialize().objects?.find((property) => property.property === 'age')?.schema).toMatchObject({
      minimum: 18,
    })
  })

  it('bounds large schema previews without dropping constraints from stored schema', async () => {
    const { z } = await import('@bpinternal/zui')
    const memory = new Memory()
    const values = Array.from({ length: 100 }, (_, index) => `option_${index}`)
    await memory.syncObjects([
      {
        name: 'settings',
        properties: [
          {
            name: 'choice',
            value: 'option_0',
            type: z.enum(values as [string, ...string[]]),
            writable: true,
          },
        ],
      },
    ])
    const overview = memory.render({ turn: 1, maxChars: 800 })
    expect(overview.length).toBeLessThanOrEqual(800)
    expect(overview).toContain('100 allowed values')
    const schema = memory.serialize().objects?.[0]?.schema
    expect(schema && typeof schema === 'object' && schema.enum).toEqual(values)
  })

  it('records property provenance, persists it, and rehydrates only from the authoritative host', async () => {
    const memory = new Memory()
    const object = {
      name: 'account',
      properties: [
        {
          name: 'balance',
          value: 42,
          writable: true,
        },
      ],
    }
    await memory.syncObjects([object])
    const changes = memory.recordObjectMutations(
      [
        {
          object: 'account',
          property: 'balance',
          before: 42,
          after: 42,
        },
      ],
      {
        timestamp: 1000,
        turn: 1,
        id: 'one',
        number: 1,
      }
    )
    expect(changes[0]?.name).toBe('account.balance')
    const restored = Memory.restore(JSON.parse(JSON.stringify(memory)))
    expect(
      restored.render({
        turn: 3,
        now: 61000,
      })
    ).not.toContain('account.balance')
    await restored.syncObjects([object])
    expect(
      restored.render({
        turn: 3,
        now: 61000,
      })
    ).toContain('updated 1 minute ago (2 turns ago)')
    await restored.syncObjects(
      [
        {
          ...object,
          properties: [
            {
              name: 'balance',
              value: 60,
              writable: true,
            },
          ],
        },
      ],
      {
        timestamp: 62000,
        turn: 3,
      }
    )
    expect(
      restored.render({
        turn: 3,
        now: 62000,
      })
    ).toContain('balance`: 60')
    expect(
      restored.render({
        turn: 3,
        now: 62000,
      })
    ).toContain('updated just now (this turn)')
  })

  it('keeps a VM property update when the host supplies its unchanged initial value', async () => {
    const memory = new Memory()
    const object = {
      name: 'account',
      properties: [
        {
          name: 'balance',
          value: 42,
          writable: true,
        },
      ],
    }
    await memory.syncObjects([object])
    memory.recordObjectMutations(
      [
        {
          object: 'account',
          property: 'balance',
          before: 42,
          after: 50,
        },
      ],
      {
        timestamp: 1000,
        turn: 1,
      }
    )
    await memory.syncObjects([object], {
      timestamp: 2000,
      turn: 2,
    })
    expect(memory.getObjectPropertyValue('account', 'balance')).toBe(50)
    const restored = Memory.restore(JSON.parse(JSON.stringify(memory)))
    await restored.syncObjects([object])
    expect(restored.getObjectPropertyValue('account', 'balance')).toBe(50)
    await restored.syncObjects(
      [
        {
          name: 'account',
          properties: [
            {
              name: 'balance',
              value: 75,
              writable: true,
            },
          ],
        },
      ],
      {
        timestamp: 3000,
        turn: 3,
      }
    )
    expect(restored.getObjectPropertyValue('account', 'balance')).toBe(75)
  })

  it('rejects namespace collisions and keeps read-only properties protected', async () => {
    const memory = new Memory({
      variables: {
        account: 42,
      },
    })
    await expect(
      memory.syncObjects([
        {
          name: 'account',
        },
      ])
    ).rejects.toThrow(/conflicts/)
    const properties = new Memory()
    await properties.syncObjects([
      {
        name: 'account',
        properties: [
          {
            name: 'id',
            value: 1,
            writable: false,
          },
        ],
      },
    ])
    expect(() =>
      properties.recordObjectMutations(
        [
          {
            object: 'account',
            property: 'id',
            before: 1,
            after: 2,
          },
        ],
        {}
      )
    ).toThrow(/read-only/)
  })
})
