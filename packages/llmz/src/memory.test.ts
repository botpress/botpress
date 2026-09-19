import { describe, expect, it } from 'vitest'
import { Memory, MemoryCapacityError } from './memory.js'
const settlement = (number: number, result?: unknown) => ({
  id: `i${number}`,
  number,
  turn: 1,
  timestamp: number * 1000,
  outcome: 'completed',
  hasResult: true,
  result,
})
describe('explicit session memory', () => {
  it('stores exact results independently of previews and keeps history immutable', () => {
    const memory = new Memory()
    memory.commit({
      ...settlement(1, {
        account: {
          id: 1,
        },
        text: 'x'.repeat(1000),
      }),
      variables: {
        account: {
          id: 1,
        },
      },
    })
    const bindings = memory.getBindings()
    expect(() => ((bindings.$return as any).account.id = 2)).toThrow()
    const account = bindings.account as { id: number }
    account.id = 4
    expect((memory.getBindings().$return as any).account.id).toBe(1)
    expect((memory.getBindings().$return as any).text).toHaveLength(1000)
  })

  it('has newest-first settled entries including errors and distinguishes undefined from absent', () => {
    const memory = new Memory()
    memory.commit(settlement(1, 42))
    memory.commit({
      ...settlement(2),
      hasResult: false,
      outcome: 'error',
    })
    expect(memory.getBindings().$return).toBe(42)
    expect((memory.getBindings().$iterations as any)[0].hasResult).toBe(false)
    memory.commit(settlement(3))
    expect(memory.getBindings().$return).toBeUndefined()
    expect((memory.getBindings().$iterations as any)[0]).toMatchObject({
      hasResult: true,
      result: undefined,
    })
    expect(
      memory.render({
        turn: 1,
        now: 3000,
      })
    ).toContain('$iterations[0].result')
  })

  it('preserves named state and original age across compaction and JSON restoration', () => {
    const memory = new Memory()
    memory.commit({
      ...settlement(1, {
        x: undefined,
      }),
      variables: {
        account: {
          id: 1,
        },
        unset: undefined,
      },
    })
    memory.commit(settlement(2, 'two'))
    memory.compact(['i1'])
    expect(memory.getBindings().$return).toBeUndefined()
    expect((memory.getBindings().$iterations as any)[0].id).toBe('i1')
    const restored = Memory.restore(JSON.parse(JSON.stringify(memory)))
    expect(restored.variables).toEqual({
      account: {
        id: 1,
      },
      unset: undefined,
    })
    expect(
      restored.render({
        turn: 3,
        now: 61000,
      })
    ).toContain('1 minute ago (2 turns ago)')
    restored.compact([])
    expect(restored.variables.account).toEqual({
      id: 1,
    })
  })

  it('coalesces writes, refreshes equal assignments, and does not refresh reads', () => {
    const memory = new Memory()
    expect(
      memory
        .commit({
          ...settlement(1),
          variables: {
            age: 42,
          },
        })
        .created.map((v) => v.name)
    ).toEqual(['age'])
    expect(
      memory.commit({
        ...settlement(2),
        variables: {
          age: 42,
        },
      }).updated
    ).toEqual([])
    const updated = memory.commit({
      ...settlement(3),
      variables: {
        age: 42,
      },
      variableWrites: [
        {
          name: 'age',
          timestamp: 2500,
        },
        {
          name: 'age',
          timestamp: 2900,
        },
      ],
    })
    expect(updated.updated).toHaveLength(1)
    expect(updated.updated[0]?.provenance.timestamp).toBe(2900)
  })

  it('reports unavailable unsupported or over-budget values without fake placeholders', () => {
    const memory = new Memory({
      maxBytes: 4000,
    })
    const report = memory.commit({
      ...settlement(1, new Date()),
      variables: {
        unsupported: () => 42,
        tooBig: 'x'.repeat(5000),
        ok: 2,
      },
    })
    expect(report.unavailable.map((v) => v.name)).toEqual(['unsupported', 'tooBig', '$return'])
    expect(memory.variables).toEqual({
      ok: 2,
    })
    expect((memory.getBindings().$iterations as any)[0].hasResult).toBe(false)
    expect(
      () =>
        new Memory({
          variables: {
            $return: 1,
          },
        })
    ).toThrow(/reserved/)
  })

  it('keeps partial changes but clears failed captures instead of exposing old values', () => {
    const memory = new Memory({
      variables: {
        account: 'old',
      },
    })
    const report = memory.commit({
      ...settlement(1),
      hasResult: false,
      outcome: 'error',
      variables: {
        prefix: 1,
      },
      captureErrors: [
        {
          name: 'account',
          reason: 'initialization failed',
        },
      ],
    })
    expect(report.created[0]?.name).toBe('prefix')
    expect(memory.variables).toEqual({
      prefix: 1,
    })
  })

  it('resolves snapshot assignments without fabricating iterations or successful returns', () => {
    const memory = new Memory()
    memory.commit(settlement(1, 'before'))
    memory.assign(
      {
        resolved: 42,
      },
      {
        id: 'i1',
        number: 1,
        turn: 1,
        timestamp: 2000,
      }
    )
    expect(memory.iterations).toHaveLength(1)
    expect(memory.variables.resolved).toBe(42)
    expect(memory.getBindings().$return).toBe('before')
  })

  it('rejects persisted payload loss and budgets the overview', () => {
    const memory = new Memory()
    for (let i = 1; i <= 10; i++) {
      memory.commit(
        settlement(i, {
          large: 'x'.repeat(500),
        })
      )
    }

    const serialized = memory.serialize()
    delete serialized.iterations[0]!.value
    expect(() => Memory.restore(serialized)).toThrow(/Missing result payload/)
    expect(
      memory.render({
        turn: 1,
        maxChars: 800,
      }).length
    ).toBeLessThan(900)
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
    expect(memory.getBindings()).not.toHaveProperty('account')
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
describe('memory capacity preflight', () => {
  it('rejects insufficient metadata capacity before execution without modifying history', () => {
    const memory = new Memory({
      maxBytes: 1000,
    })
    expect(() => memory.assertCapacityForIteration()).toThrow(MemoryCapacityError)
    expect(memory.iterations).toEqual([])
  })

  it('bounds metadata-only histories without evicting retained state', () => {
    const memory = new Memory({
      maxBytes: 1000,
    })
    let completed = 0
    for (let number = 1; number <= 100; number++) {
      try {
        memory.commit({
          ...settlement(number),
          hasResult: false,
        })
        completed++
      } catch (error) {
        expect(error).toBeInstanceOf(MemoryCapacityError)
        break
      }
    }

    expect(completed).toBeGreaterThan(0)
    expect(completed).toBeLessThan(100)
    expect(memory.iterations).toHaveLength(completed)
    expect(new TextEncoder().encode(JSON.stringify(memory)).byteLength).toBeLessThanOrEqual(1000)
  })
})
