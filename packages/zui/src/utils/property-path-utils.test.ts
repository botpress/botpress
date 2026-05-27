import { describe, it, expect } from 'vitest'
import { PropertyPath } from './property-path-utils'

describe.concurrent('PropertyPath', () => {
  it('returns only # for an empty path', () => {
    expect(new PropertyPath().toString()).toBe('#')
  })

  it('renders a name-only section', () => {
    expect(new PropertyPath().appendSection('foo').toString()).toBe('#.foo')
  })

  describe.concurrent('withIndexType', () => {
    it('adds a number index without a value', () => {
      const path = new PropertyPath().appendSection('foo').withIndexType('number')
      expect(path.toString()).toBe('#.foo[number]')
    })

    it('adds a number index with a value', () => {
      const path = new PropertyPath().appendSection('foo').withIndexType('number', 3)
      expect(path.toString()).toBe('#.foo[3]')
    })

    it('adds a string index without a value', () => {
      const path = new PropertyPath().appendSection('foo').withIndexType('string')
      expect(path.toString()).toBe('#.foo[string]')
    })

    it('adds a string index with a value', () => {
      const path = new PropertyPath().appendSection('foo').withIndexType('string', 'foo')
      expect(path.toString()).toBe('#.foo[foo]')
    })

    it('adds an any index', () => {
      const path = new PropertyPath().appendSection('foo').withIndexType('any')
      expect(path.toString()).toBe('#.foo[*]')
    })

    it('stacks multiple indices on the same section', () => {
      const path = new PropertyPath().appendSection('foo').withIndexType('number', 2).withIndexType('string', 'col')
      expect(path.toString()).toBe('#.foo[2][col]')
    })

    it('applies different index types on consecutive sections', () => {
      const path = new PropertyPath()
        .appendSection('foo')
        .withIndexType('number', 2)
        .appendSection('bar')
        .withIndexType('string', 'baz')
      expect(path.toString()).toBe('#.foo[2].bar[baz]')
    })
  })

  describe.concurrent('withPrefix', () => {
    it('prepends the prefix followed by a space before the #', () => {
      const path = new PropertyPath().appendSection('foo').withPrefix('keyOf')
      expect(path.toString()).toBe('keyOf #.foo')
    })

    it('does not mutate the original', () => {
      const original = new PropertyPath().appendSection('foo')
      const prefixed: PropertyPath = original.withPrefix('keyOf')
      expect(original.toString()).toBe('#.foo')
      expect(prefixed.toString()).toBe('keyOf #.foo')
    })

    it('prefix is preserved through appendSection', () => {
      const path = new PropertyPath().appendSection('foo').withPrefix('keyOf').appendSection('bar')
      expect(path.toString()).toBe('keyOf #.foo.bar')
    })

    it('prefix is preserved through withIndexType', () => {
      const path = new PropertyPath().appendSection('foo').withPrefix('keyOf').withIndexType('number', 1)
      expect(path.toString()).toBe('keyOf #.foo[1]')
    })
  })

  describe.concurrent('appendSection', () => {
    it('does not mutate the original', () => {
      const original = new PropertyPath()
      const next = original.appendSection('foo')
      expect(original.toString()).toBe('#')
      expect(next.toString()).toBe('#.foo')
    })

    it('chains multiple appends', () => {
      const path = new PropertyPath().appendSection('foo').appendSection('bar')
      expect(path.toString()).toBe('#.foo.bar')
    })
  })
})
