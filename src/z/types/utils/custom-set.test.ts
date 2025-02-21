import { it, expect, describe } from 'vitest'
import { CustomSet } from './custom-set'

describe.concurrent('CustomSet', () => {
  describe.concurrent('sets of primitives', () => {
    it('does not contain the same item twice', () => {
      const set = new CustomSet([1, 1, 1])
      expect(set.size).toBe(1)
    })

    it('uses the provided equality function', () => {
      const set = new CustomSet([1, 2, 3], {
        compare: (a, b) => Math.floor(a / 2) === Math.floor(b / 2),
      })
      expect(set.size).toBe(2)
    })

    it('is subset of another set with more items', () => {
      const set = new CustomSet([1, 2])
      const other = new CustomSet([1, 2, 3])
      expect(set.isSubsetOf(other)).toBe(true)
    })

    it('is not subset of another set with less items', () => {
      const set = new CustomSet([1, 2, 3])
      const other = new CustomSet([1, 2])
      expect(set.isSubsetOf(other)).toBe(false)
    })

    it('is subset of another identical set', () => {
      const set = new CustomSet([1, 2, 3])
      const other = new CustomSet([1, 2, 3])
      expect(set.isSubsetOf(other)).toBe(true)
      expect(other.isSubsetOf(set)).toBe(true)
    })
  })

  describe.concurrent('sets of reference types', () => {
    describe.concurrent('class instances', () => {
      class Foo {
        constructor(public id: number) {}
      }

      it('does not contain the same item twice', () => {
        const set = new CustomSet([new Foo(1), new Foo(1), new Foo(1)])
        expect(set.size).toBe(1)
      })

      it('uses the provided equality function', () => {
        const set = new CustomSet([new Foo(1), new Foo(2), new Foo(3)], {
          compare: (a, b) => Math.floor(a.id / 2) === Math.floor(b.id / 2),
        })
        expect(set.size).toBe(2)
      })

      it('is subset of another set with more items', () => {
        const set = new CustomSet([new Foo(1), new Foo(2)])
        const other = new CustomSet([new Foo(1), new Foo(2), new Foo(3)])
        expect(set.isSubsetOf(other)).toBe(true)
      })

      it('is not subset of another set with less items', () => {
        const set = new CustomSet([new Foo(1), new Foo(2), new Foo(3)])
        const other = new CustomSet([new Foo(1), new Foo(2)])
        expect(set.isSubsetOf(other)).toBe(false)
      })

      it('is subset of another identical set', () => {
        const set = new CustomSet([new Foo(1), new Foo(2), new Foo(3)])
        const other = new CustomSet([new Foo(1), new Foo(2), new Foo(3)])
        expect(set.isSubsetOf(other)).toBe(true)
        expect(other.isSubsetOf(set)).toBe(true)
      })
    })

    describe.concurrent('plain objects', () => {
      it('does not contain the same item twice', () => {
        const set = new CustomSet([{ id: 1 }, { id: 1 }, { id: 1 }])
        expect(set.size).toBe(1)
      })

      it('uses the provided equality function', () => {
        const set = new CustomSet([{ id: 1 }, { id: 2 }, { id: 3 }], {
          compare: (a, b) => Math.floor(a.id / 2) === Math.floor(b.id / 2),
        })
        expect(set.size).toBe(2)
      })

      it('is subset of another set with more items', () => {
        const set = new CustomSet([{ id: 1 }, { id: 2 }])
        const other = new CustomSet([{ id: 1 }, { id: 2 }, { id: 3 }])
        expect(set.isSubsetOf(other)).toBe(true)
      })

      it('is not subset of another set with less items', () => {
        const set = new CustomSet([{ id: 1 }, { id: 2 }, { id: 3 }])
        const other = new CustomSet([{ id: 1 }, { id: 2 }])
        expect(set.isSubsetOf(other)).toBe(false)
      })

      it('is subset of another identical set', () => {
        const set = new CustomSet([{ id: 1 }, { id: 2 }, { id: 3 }])
        const other = new CustomSet([{ id: 1 }, { id: 2 }, { id: 3 }])
        expect(set.isSubsetOf(other)).toBe(true)
        expect(other.isSubsetOf(set)).toBe(true)
      })
    })

    describe.concurrent('plain objects with some undefined values', () => {
      it('does not contain the same item twice', () => {
        const set = new CustomSet([{ id: 1 }, { id: 1, foo: undefined }, { id: 1 }])
        expect(set.size).toBe(1)
      })

      it('uses the provided equality function', () => {
        const set = new CustomSet([{ id: 1 }, { id: 2, foo: undefined }, { id: 3 }], {
          compare: (a, b) => Math.floor(a.id / 2) === Math.floor(b.id / 2),
        })
        expect(set.size).toBe(2)
      })

      it('is subset of another set with more items', () => {
        const set = new CustomSet([{ id: 1 }, { id: 2 }])
        const other = new CustomSet([{ id: 1, foo: undefined }, { id: 2 }, { id: 3 }])
        expect(set.isSubsetOf(other)).toBe(true)
      })

      it('is not subset of another set with less items', () => {
        const set = new CustomSet([{ id: 1 }, { id: 2 }, { id: 3 }])
        const other = new CustomSet([{ id: 1, foo: undefined }, { id: 2 }])
        expect(set.isSubsetOf(other)).toBe(false)
      })

      it('is subset of another identical set', () => {
        const set = new CustomSet([{ id: 1 }, { id: 2 }, { id: 3 }])
        const other = new CustomSet([{ id: 1 }, { id: 2, foo: undefined }, { id: 3 }])
        expect(set.isSubsetOf(other)).toBe(true)
        expect(other.isSubsetOf(set)).toBe(true)
      })
    })
  })
})
