import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'
import { normalizeComponentDefinition } from './normalizer.js'

describe('component normalizer', () => {
  it('normalizes a zui-based definition into a JSON-schema definition', () => {
    const normalized = normalizeComponentDefinition({
      name: 'product-card',
      description: 'Displays one recommended product.',
      props: z.object({
        title: z.string().describe('Short product name'),
        price: z.string().optional(),
        featured: z.boolean().optional(),
      }),
      body: {
        type: 'markdown',
        description: 'Why the product is recommended.',
        required: true,
      },
    })

    expect(normalized.name).toBe('product-card')
    expect(normalized.body).toEqual({
      format: 'markdown',
      description: 'Why the product is recommended.',
      required: true,
    })

    const schema = normalized.propsJsonSchema
    expect(schema.type).toBe('object')
    expect(Object.keys(schema.properties ?? {})).toEqual(['title', 'price', 'featured'])
    expect(schema.required).toEqual(['title'])
    expect((schema.properties?.title as { description?: string }).description).toBe('Short product name')
  })

  it('accepts a plain JSON schema', () => {
    const schema = {
      type: 'object' as const,
      properties: { src: { type: 'string' as const } },
      required: ['src'],
    }
    const normalized = normalizeComponentDefinition({ name: 'image', props: schema })
    expect(normalized.propsJsonSchema).toBe(schema)
  })

  it('defaults to an empty props schema', () => {
    const normalized = normalizeComponentDefinition({ name: 'md' })
    expect(normalized.propsJsonSchema).toEqual({ type: 'object', properties: {}, additionalProperties: false })
    expect(normalized.body).toBeUndefined()
  })

  it('normalizes names to lowercase', () => {
    expect(normalizeComponentDefinition({ name: ' Product-Card ' }).name).toBe('product-card')
  })

  it('defaults body.required to false', () => {
    const normalized = normalizeComponentDefinition({ name: 'callout', body: { type: 'markdown' } })
    expect(normalized.body).toEqual({ format: 'markdown', description: undefined, required: false })
  })

  it('rejects invalid names', () => {
    expect(() => normalizeComponentDefinition({ name: '' })).toThrow()
    expect(() => normalizeComponentDefinition({ name: '9lives' })).toThrow()
    expect(() => normalizeComponentDefinition({ name: 'has space' })).toThrow()
  })

  it('rejects non-schema props', () => {
    expect(() => normalizeComponentDefinition({ name: 'bad', props: 42 as never })).toThrow()
  })

  it('preserves generation metadata', () => {
    const normalized = normalizeComponentDefinition({
      name: 'carousel',
      generation: { usage: 'Use for multiple comparable options', doNotUseWhen: 'Do not use for a single item' },
    })
    expect(normalized.generation?.usage).toBe('Use for multiple comparable options')
  })
})
