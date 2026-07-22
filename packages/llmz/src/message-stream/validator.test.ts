import { describe, expect, it } from 'vitest'
import { ComponentRegistry } from './registry.js'
import type { NormalizedComponentDefinition } from './types.js'
import { validateComponent, validateProps } from './validator.js'

const productCard: NormalizedComponentDefinition = {
  name: 'product-card',
  description: 'Displays one recommended product.',
  propsJsonSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Short product name' },
      price: { type: 'string' },
      featured: { type: 'boolean' },
      variant: { type: 'string', enum: ['default', 'compact'] },
      tags: { type: 'array', items: { type: 'string' } },
    },
    required: ['title'],
    additionalProperties: false,
  },
  body: {
    format: 'markdown',
    description: 'Why the product is recommended.',
    required: true,
  },
}

const image: NormalizedComponentDefinition = {
  name: 'image',
  description: 'Displays an image.',
  propsJsonSchema: {
    type: 'object',
    properties: {
      src: { type: 'string' },
      alt: { type: 'string' },
    },
    required: ['src', 'alt'],
    additionalProperties: false,
  },
}

const registry = new ComponentRegistry([productCard, image])

describe('component registry', () => {
  it('registers, gets, lists and unregisters', () => {
    const local = new ComponentRegistry()
    local.register(image)
    expect(local.has('image')).toBe(true)
    expect(local.get('image')).toBe(image)
    expect(local.list()).toEqual([image])
    local.unregister('image')
    expect(local.has('image')).toBe(false)
  })

  it('rejects invalid component names', () => {
    expect(() => new ComponentRegistry().register({ ...image, name: 'Bad Name' })).toThrow()
  })
})

describe('component validator', () => {
  it('accepts a valid component', () => {
    const result = validateComponent(
      { name: 'product-card', props: { title: 'MacBook', variant: 'compact', tags: ['dev'] }, body: 'Great laptop.' },
      registry
    )
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('flags unknown components', () => {
    const result = validateComponent({ name: 'unknown-widget', props: {}, body: 'Hello' }, registry)
    expect(result.valid).toBe(false)
    expect(result.errors[0]!.code).toBe('unknown-component')
    expect(result.errors[0]!.message).toContain('product-card')
  })

  it('flags missing required props', () => {
    const result = validateComponent({ name: 'product-card', props: { price: '$20' }, body: 'Nice.' }, registry)
    expect(result.errors.some((e) => e.code === 'missing-required-prop' && e.path === 'title')).toBe(true)
  })

  it('flags unexpected props when additionalProperties is false', () => {
    const result = validateComponent({ name: 'product-card', props: { title: 'A', color: 'red' }, body: 'B' }, registry)
    expect(result.errors.some((e) => e.code === 'unexpected-prop' && e.path === 'color')).toBe(true)
  })

  it('flags wrong prop types', () => {
    const result = validateComponent({ name: 'product-card', props: { title: 42 }, body: 'B' }, registry)
    expect(result.errors.some((e) => e.code === 'invalid-prop-value' && e.path === 'title')).toBe(true)
  })

  it('flags enum violations', () => {
    const result = validateComponent(
      { name: 'product-card', props: { title: 'A', variant: 'huge' }, body: 'B' },
      registry
    )
    expect(result.errors.some((e) => e.code === 'invalid-prop-value' && e.path === 'variant')).toBe(true)
  })

  it('validates array items', () => {
    const result = validateComponent(
      { name: 'product-card', props: { title: 'A', tags: ['ok', 5] }, body: 'B' },
      registry
    )
    expect(result.errors.some((e) => e.code === 'invalid-prop-value' && e.path === 'tags[1]')).toBe(true)
  })

  it('flags a body on a bodyless component', () => {
    const result = validateComponent({ name: 'image', props: { src: 'https://x', alt: 'x' }, body: 'oops' }, registry)
    expect(result.errors.some((e) => e.code === 'body-not-allowed')).toBe(true)
  })

  it('flags a missing required body', () => {
    const result = validateComponent({ name: 'product-card', props: { title: 'A' } }, registry)
    expect(result.errors.some((e) => e.code === 'missing-required-body')).toBe(true)
  })

  it('accepts a bodyless component without a body', () => {
    const result = validateComponent({ name: 'image', props: { src: 'https://x', alt: 'x' } }, registry)
    expect(result.valid).toBe(true)
  })

  it('collects multiple errors without stopping', () => {
    const result = validateComponent({ name: 'product-card', props: { price: 2, extra: true } }, registry)
    const codes = result.errors.map((e) => e.code).sort()
    expect(codes).toEqual(['invalid-prop-value', 'missing-required-body', 'missing-required-prop', 'unexpected-prop'])
  })
})

describe('props validator', () => {
  it('validates nested objects', () => {
    const errors = validateProps(
      { config: { size: 'big' } },
      {
        type: 'object',
        properties: {
          config: {
            type: 'object',
            properties: { size: { type: 'string', enum: ['small', 'large'] } },
            additionalProperties: false,
          },
        },
      }
    )
    expect(errors.some((e) => e.code === 'invalid-prop-value' && e.path === 'config.size')).toBe(true)
  })

  it('supports anyOf variants', () => {
    const schema = {
      type: 'object' as const,
      properties: { value: { anyOf: [{ type: 'string' as const }, { type: 'number' as const }] } },
    }
    expect(validateProps({ value: 'ok' }, schema)).toEqual([])
    expect(validateProps({ value: 5 }, schema)).toEqual([])
    expect(validateProps({ value: true }, schema)).toHaveLength(1)
  })

  it('is lenient about unknown keywords and open objects', () => {
    expect(validateProps({ anything: 'goes' }, { type: 'object' })).toEqual([])
  })
})
