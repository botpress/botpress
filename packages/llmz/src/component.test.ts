import { z } from '@bpinternal/zui'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Component, isAnyComponent, isComponent, prepareComponentDelivery } from './component.js'

const definition = {
  name: 'Rating',
  description: 'A customer rating.',
  props: z.object({ score: z.number().min(0).max(5), label: z.string().default('Rating') }),
}

describe('Component', () => {
  it('validates props, applies defaults, and preserves the definition name', () => {
    const component = new Component(definition)
    const rendered = component.render({ score: 4 })

    expect(rendered).toEqual({ type: 'component', name: 'Rating', props: { score: 4, label: 'Rating' } })
    expectTypeOf(rendered.props).toEqualTypeOf<{ score: number; label: string }>()
    expect(() => component.render({ score: 6 })).toThrow()
    expect(() => component.render({ score: 'four' } as never)).toThrow()
    expect(rendered).not.toHaveProperty('__jsx')
    expect(rendered).not.toHaveProperty('children')
  })

  it('binds a typed handler without modifying the reusable definition', () => {
    const template = new Component({
      ...definition,
      aliases: ['stars'],
      generation: { examples: [{ props: { score: 4 } }] },
    })
    const handler = vi.fn()
    const bound = template.withHandler(handler)

    expect(template.handler).toBeUndefined()
    expect(bound.handler).toBe(handler)
    expect(bound.definition.props).toBe(template.definition.props)
    expect(bound.definition.generation).toBe(template.definition.generation)
    expect(bound.definition.aliases).toEqual(['stars'])
    expect(bound.render({ score: 5 })).toEqual(template.render({ score: 5 }))

    template.withHandler((props) => {
      expectTypeOf(props).toEqualTypeOf<{ score: number; label: string }>()
    })
  })

  it('accepts a handler directly in its definition', () => {
    const handler = vi.fn()
    const component = new Component({ ...definition, handler })

    expect(component.handler).toBe(handler)
    expect(handler).not.toHaveBeenCalled()

    new Component({
      ...definition,
      handler(props) {
        expectTypeOf(props).toEqualTypeOf<{ score: number; label: string }>()
      },
    })
  })

  it.each(['message', 'Text', 'MARKDOWN', 'md', 'Speech', 'speak', 'spoken', 'm_d'])(
    'reserves native response name %s',
    (name) => {
      expect(() => new Component({ ...definition, name })).toThrow(/reserved for native assistant responses/)
      expect(() => new Component({ ...definition, aliases: [name] })).toThrow(/reserved for native assistant responses/)
    }
  )

  it.each(['Then', 'Constructor', 'Prototype', 'construcTOR'])('rejects unsafe normalized method name %s', (name) => {
    expect(() => new Component({ ...definition, name })).toThrow(/unavailable chat method/)
  })

  it.each(['', '1Card', 'Invalid Name', '__proto__'])('rejects an invalid component name %s', (name) => {
    expect(() => new Component({ ...definition, name })).toThrow()
  })

  it.each(['type', 'default', 'leaf', 'container', 'body', 'children', 'examples'])(
    'rejects legacy definition field %s',
    (field) => {
      expect(() => new Component({ ...definition, [field]: {} } as never)).toThrow(/flat props schema/)
    }
  )

  it('rejects non-object props schemas and legacy generation examples', () => {
    expect(() => new Component({ ...definition, props: z.string() } as never)).toThrow(/Zod object schema/)
    expect(
      () => new Component({ ...definition, generation: { examples: [{ props: {}, body: 'Text' }] } } as never)
    ).toThrow(/only \{ props \}/)
  })

  it('keeps ordinary schema properties named body inside props', () => {
    const component = new Component({
      name: 'Document',
      description: 'A document.',
      props: z.object({ body: z.number() }),
    })

    expect(component.render({ body: 7 })).toEqual({ type: 'component', name: 'Document', props: { body: 7 } })
  })
})

describe('component guards', () => {
  const component = new Component(definition)

  it('recognizes rendered components and narrows their props', () => {
    const rendered: unknown = component.render({ score: 4 })

    expect(isAnyComponent(rendered)).toBe(true)
    expect(isComponent(rendered, component)).toBe(true)

    if (isComponent(rendered, component)) {
      expectTypeOf(rendered.props).toEqualTypeOf<{ score: number; label: string }>()
      expect(rendered.props.score).toBe(4)
    }
  })

  it.each([
    null,
    { type: 'component', name: 'Rating' },
    { type: 'component', name: 'Rating', props: [] },
    { type: 'component', name: '', props: {} },
    { __jsx: true, type: 'RATING', props: {}, children: [] },
    { type: 'component', name: 'Rating', props: {}, children: [] },
  ])('rejects invalid or legacy rendered data: %j', (value) => {
    expect(isAnyComponent(value)).toBe(false)
    expect(isComponent(value, component)).toBe(false)
  })

  it('distinguishes components by name', () => {
    expect(isComponent({ type: 'component', name: 'Other', props: {} }, component)).toBe(false)
  })
})

describe('component delivery validation', () => {
  it('validates raw descriptors and applies defaults and transformations once', () => {
    const transform = vi.fn((score: number) => score + 1)
    const component = new Component({
      ...definition,
      props: z.object({ score: z.number().transform(transform), label: z.string().default('Rating') }),
    })
    const prepared = prepareComponentDelivery(component, { type: 'component', name: 'Rating', props: { score: 3 } })

    expect(prepared).toEqual({ type: 'component', name: 'Rating', props: { score: 4, label: 'Rating' } })
    expect(transform).toHaveBeenCalledTimes(1)
    expect(prepareComponentDelivery(component, prepared)).toEqual(prepared)
    expect(transform).toHaveBeenCalledTimes(1)
  })

  it('does not re-transform props returned by render or by an equivalent bound component', () => {
    const transform = vi.fn((score: number) => `Score: ${score}`)
    const template = new Component({ ...definition, props: z.object({ score: z.number().transform(transform) }) })
    const rendered = template.render({ score: 4 })
    const bound = template.withHandler(vi.fn())
    const prepared = prepareComponentDelivery(bound, rendered)

    expect(prepared.props).toEqual({ score: 'Score: 4' })
    expect(transform).toHaveBeenCalledTimes(1)
    expect(prepared).not.toBe(rendered)
  })

  it('rejects malformed, unregistered, and schema-invalid raw descriptors', () => {
    const component = new Component(definition)

    expect(() => prepareComponentDelivery(component, { type: 'component', name: 'Rating' })).toThrow(/requires/)
    expect(() =>
      prepareComponentDelivery(component, { type: 'component', name: 'Other', props: { score: 4 } })
    ).toThrow(/not registered/)
    expect(() =>
      prepareComponentDelivery(component, { type: 'component', name: 'Rating', props: { score: 'invalid' } })
    ).toThrow()
  })

  it('revalidates changed nested props instead of trusting the descriptor identity', () => {
    const component = new Component({
      ...definition,
      props: z.object({ scores: z.array(z.number().max(5)) }),
    })
    const rendered = component.render({ scores: [4] })
    rendered.props.scores.push(10)

    expect(() => prepareComponentDelivery(component, rendered)).toThrow()
  })

  it('parses valid changed props as new input', () => {
    const transform = vi.fn((score: number) => score + 1)
    const component = new Component({ ...definition, props: z.object({ score: z.number().transform(transform) }) })
    const rendered = component.render({ score: 1 })
    rendered.props.score = 4

    expect(prepareComponentDelivery(component, rendered).props).toEqual({ score: 5 })
    expect(transform).toHaveBeenCalledTimes(2)
  })

  it('revalidates descriptors from a different schema or a copied object', () => {
    const original = new Component({ ...definition, props: z.object({ score: z.string() }) })
    const registered = new Component(definition)
    const rendered = original.render({ score: 'invalid' })

    expect(() => prepareComponentDelivery(registered, rendered)).toThrow()

    const forged = { ...registered.render({ score: 4 }), props: { score: 'invalid' } }

    expect(() => prepareComponentDelivery(registered, forged)).toThrow()
  })

  it('delivers an independent snapshot after validation', () => {
    const component = new Component({ ...definition, props: z.object({ scores: z.array(z.number().max(5)) }) })
    const rendered = component.render({ scores: [4] })
    const prepared = prepareComponentDelivery(component, rendered)
    rendered.props.scores.push(10)

    expect(prepared.props.scores).toEqual([4])
    expect(prepareComponentDelivery(component, prepared).props.scores).toEqual([4])
  })
})
