import { z } from '@bpinternal/zui'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Component, createComponentRegistry, isAnyComponent, isComponent } from './component.js'

const definition = {
  name: 'rating',
  description: 'A customer rating.',
  props: z.object({ score: z.number().min(0).max(5), label: z.string().default('Rating') }),
}

describe('Component', () => {
  it('validates props, applies defaults, and preserves the exact method name', () => {
    const component = new Component(definition)
    const rendered = component.render({ score: 4 })

    expect(rendered).toEqual({ type: 'component', name: 'rating', props: { score: 4, label: 'Rating' } })
    expectTypeOf(rendered.props).toEqualTypeOf<{ score: number; label: string }>()
    expect(() => component.render({ score: 6 })).toThrow()
    expect(() => component.render({ score: 'four' } as never)).toThrow()
  })

  it('supports array props as one flat message', () => {
    const component = new Component({ ...definition, name: 'ratings', props: z.array(definition.props).min(1) })
    const rendered = component.render([{ score: 4 }, { score: 2 }])

    expect(rendered.props).toEqual([
      { score: 4, label: 'Rating' },
      { score: 2, label: 'Rating' },
    ])
    expectTypeOf(rendered.props).toEqualTypeOf<Array<{ score: number; label: string }>>()
    expect(() => component.render([])).toThrow()
    expect(() => component.render([{ score: 4 }, { score: 9 }])).toThrow()
  })

  it('binds typed handlers without changing reusable definitions', () => {
    const template = new Component(definition)
    const handler = vi.fn()
    const bound = template.withHandler(handler)

    expect(template.handler).toBeUndefined()
    expect(bound.handler).toBe(handler)
    expect(bound.definition.props).toBe(template.definition.props)
    expect(bound.render({ score: 5 })).toEqual(template.render({ score: 5 }))
    expect(handler).not.toHaveBeenCalled()

    template.withHandler((props) => {
      expectTypeOf(props).toEqualTypeOf<{ score: number; label: string }>()
    })
  })

  it('captures the definition so later host changes cannot rename an active method', () => {
    const mutable = { ...definition }
    const component = new Component(mutable)
    mutable.name = 'changed'

    expect(component.definition.name).toBe('rating')
    expect(Object.isFrozen(component.definition)).toBe(true)
  })

  it.each(['message', 'Text', 'MARKDOWN', 'md', 'Speech', 'speak', 'spoken'])(
    'reserves native response name %s',
    (name) => {
      expect(() => new Component({ ...definition, name })).toThrow(/reserved for native assistant responses/)
    }
  )

  it.each(['button', 'Button', 'then', 'Constructor', 'Prototype', '__proto__'])(
    'rejects reserved method name %s',
    (name) => {
      expect(() => new Component({ ...definition, name })).toThrow(/unavailable/)
    }
  )

  it.each(['', '1Card', 'Invalid Name', 'url-preview', 'x'.repeat(51)])('rejects invalid name %s', (name) => {
    expect(() => new Component({ ...definition, name })).toThrow(/JavaScript identifier/)
  })

  it.each(['type', 'default', 'leaf', 'container', 'body', 'children', 'examples', 'aliases', 'generation'])(
    'rejects removed option %s',
    (field) => {
      expect(() => new Component({ ...definition, [field]: {} } as never)).toThrow(/Unknown component option/)
    }
  )

  it('requires object or array props while allowing an ordinary property named body', () => {
    // @ts-expect-error Primitive schemas are also rejected by the public type contract.
    expect(() => new Component({ ...definition, props: z.string() })).toThrow(/object or array schema/)
    const component = new Component({ ...definition, props: z.object({ body: z.number() }) })

    expect(component.render({ body: 7 }).props).toEqual({ body: 7 })
  })
})

describe('component registry', () => {
  it('uses exact names without aliases or normalization', () => {
    const preview = new Component({ ...definition, name: 'URLPreview' })
    const registry = createComponentRegistry([preview])

    expect(registry.get('URLPreview')).toBe(preview)
    expect(registry.has('urlPreview')).toBe(false)
    expect(createComponentRegistry([]).size).toBe(0)
  })

  it('rejects duplicate methods before generation', () => {
    expect(() => createComponentRegistry([new Component(definition), new Component(definition)])).toThrow(
      /Duplicate component name: rating/
    )
  })
})

describe('component delivery', () => {
  it('parses props once and freezes the rendered value', () => {
    const transform = vi.fn((score: number) => `Score: ${score}`)
    const template = new Component({ ...definition, props: z.object({ score: z.number().transform(transform) }) })
    const rendered = template.render({ score: 4 })

    expect(rendered.props).toEqual({ score: 'Score: 4' })
    expect(transform).toHaveBeenCalledTimes(1)
    expect(() => {
      rendered.props.score = 'Changed'
    }).toThrow(TypeError)
  })

  it('freezes nested props and isolates them from input data', () => {
    const component = new Component({ ...definition, props: z.object({ scores: z.array(z.number()) }) })
    const input = { scores: [4] }
    const rendered = component.render(input)
    input.scores.push(1)

    expect(rendered.props.scores).toEqual([4])
    expect(() => rendered.props.scores.push(2)).toThrow(TypeError)
  })

  it('recognizes object and array renders with exact component names', () => {
    const component = new Component(definition)
    const rendered: unknown = component.render({ score: 4 })

    expect(isAnyComponent(rendered)).toBe(true)
    expect(isComponent(rendered, component)).toBe(true)
    expect(isComponent({ type: 'component', name: 'Rating', props: { score: 4 } }, component)).toBe(false)
    expect(isAnyComponent({ type: 'component', name: 'ratings', props: [] })).toBe(true)

    if (isComponent(rendered, component)) {
      expectTypeOf(rendered.props).toEqualTypeOf<{ score: number; label: string }>()
    }
  })

  it.each([
    null,
    { type: 'component', name: 'rating' },
    { type: 'component', name: 'rating', props: 'text' },
    { type: 'component', name: '', props: {} },
    { __jsx: true, type: 'component', name: 'rating', props: {} },
    { type: 'component', name: 'rating', props: {}, children: [] },
  ])('rejects invalid descriptors: %j', (value) => {
    expect(isAnyComponent(value)).toBe(false)
  })
})
