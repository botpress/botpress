import { z } from '@bpinternal/zui'
import { describe, it, expect, beforeAll } from 'vitest'
import { ObjectInstance } from './objects.js'
import { Tool } from './tool.js'
import { init } from './utils.js'

describe('Objects', () => {
  beforeAll(async () => {
    await init()
  })

  it('minimum viable object', () => {
    new ObjectInstance({
      name: 'add',
    })
  })

  it('with description', () => {
    new ObjectInstance({
      name: 'add',
      description: 'Adds two numbers',
    })
  })

  it('name is assignable', () => {
    expect(
      () =>
        new ObjectInstance({
          name: 'add numbers',
        })
    ).toThrow(/name/i)
  })
})

describe('Object tool declarations', () => {
  beforeAll(async () => {
    await init()
  })

  it('renders only tools while properties remain in memory', async () => {
    const object = new ObjectInstance({
      name: 'account',
      description: 'Customer account tools',
      properties: [{ name: 'privateValue', value: 'stored-only-in-memory', type: z.string(), writable: true }],
      tools: [
        new Tool({
          name: 'lookup',
          description: 'Find an account',
          input: z.object({ id: z.string() }),
          output: z.object({ found: z.boolean() }),
          handler: async () => ({ found: true }),
        }),
      ],
    })
    const declarations = await object.getToolTypings()

    expect(declarations).toContain('export namespace account')
    expect(declarations).toContain('Customer account tools')
    expect(declarations).toContain('function lookup(')
    expect(declarations).toContain('id: string')
    expect(declarations).toContain('Promise<{')
    expect(declarations).not.toContain('privateValue')
    expect(declarations).not.toContain('stored-only-in-memory')
  })

  it('keeps an empty namespace valid and rejects invalid property names', async () => {
    expect(await new ObjectInstance({ name: 'account' }).getToolTypings()).toBe('export namespace account {}')
    expect(() => new ObjectInstance({ name: 'account', properties: [{ name: 'invalid name', value: 1 }] })).toThrow()
  })
})
