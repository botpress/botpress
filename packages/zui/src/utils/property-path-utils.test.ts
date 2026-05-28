import { describe, it, expect } from 'vitest'
import { PropertyPath } from './property-path-utils'

describe.concurrent('PropertyPath', () => {
  it('returns only # for an empty path', () => {
    expect(new PropertyPath().toString()).toBe('#')
  })

  it('adds a key index with a dot', () => {
    expect(new PropertyPath().withIndexType('key', 'foo').toString()).toBe('#.foo')
  })

  describe.concurrent('withIndexType', () => {
    it('adds a number index without a value', () => {
      const path = new PropertyPath().withIndexType('number')
      expect(path.toString()).toBe('#[number]')
    })

    it('adds a number index with a value', () => {
      const path = new PropertyPath().withIndexType('number', 3)
      expect(path.toString()).toBe('#[3]')
    })

    it('adds a string index without a value', () => {
      const path = new PropertyPath().withIndexType('string')
      expect(path.toString()).toBe('#[string]')
    })

    it('adds a string index with a value', () => {
      const path = new PropertyPath().withIndexType('string', 'foo')
      expect(path.toString()).toBe('#[foo]')
    })

    it('adds an any index', () => {
      const path = new PropertyPath().withIndexType('any')
      expect(path.toString()).toBe('#[*]')
    })

    it('does not mutate the original', () => {
      const original = new PropertyPath()
      const next = original.withIndexType('key', 'foo')
      expect(original.toString()).toBe('#')
      expect(next.toString()).toBe('#.foo')
    })

    it('chains multiple indexType', () => {
      const path = new PropertyPath().withIndexType('key', 'foo').withIndexType('key', 'bar')
      expect(path.toString()).toBe('#.foo.bar')
    })
  })

  describe.concurrent('withPrefix', () => {
    it('prepends the prefix followed by a space before the #', () => {
      const path = new PropertyPath().withIndexType('key', 'foo').withPrefix('keyOf')
      expect(path.toString()).toBe('keyOf #.foo')
    })

    it('does not mutate the original', () => {
      const original = new PropertyPath().withIndexType('key', 'foo')
      const prefixed: PropertyPath = original.withPrefix('keyOf')
      expect(original.toString()).toBe('#.foo')
      expect(prefixed.toString()).toBe('keyOf #.foo')
    })

    it('prefix is preserved through withIndexType', () => {
      const path = new PropertyPath().withIndexType('key', 'foo').withPrefix('keyOf').withIndexType('key', 'bar')
      expect(path.toString()).toBe('keyOf #.foo.bar')
    })

    it('prefix is preserved through withIndexType', () => {
      const path = new PropertyPath().withIndexType('key', 'foo').withPrefix('keyOf').withIndexType('number', 1)
      expect(path.toString()).toBe('keyOf #.foo[1]')
    })
  })
})
