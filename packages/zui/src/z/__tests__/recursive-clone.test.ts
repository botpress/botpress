import { test, expect } from 'vitest'
import * as z from '../index'
import { toJSONSchema } from '../../transforms/zui-to-json-schema'

// clone()/describe()/title()/metadata() all deep-clone. Cloning a getter-recursive schema must produce
// a cyclic clone (not an infinite tree), so traversal (getReferences, toJSONSchema, parse) terminates.
// See RECURSIVE_SCHEMAS.md.

let cat: any
cat = z.object({
  name: z.string(),
  get subcategories() {
    return z.array(cat)
  },
})

test('clone() of a recursive schema is traversable (getReferences)', () => {
  expect(cat.clone().getReferences()).toEqual([])
})

test('clone() of a recursive schema is convertible to JSON schema', () => {
  const s = toJSONSchema(cat.clone()) as any
  expect(s.$ref).toBe('#/definitions/Schema0')
  expect(s.definitions.Schema0.properties.subcategories.items.$ref).toBe('#/definitions/Schema0')
})

test('clone() of a recursive schema still parses nested data', () => {
  const cloned = cat.clone()
  const parsed = cloned.parse({ name: 'r', subcategories: [{ name: 'k', subcategories: [] }] })
  expect(parsed.name).toBe('r')
})

test('describe() on a recursive schema is traversable', () => {
  expect(cat.describe('a tree').getReferences()).toEqual([])
})

test('title() on a recursive schema is used as the JSON-schema definition name', () => {
  const Node: any = z
    .object({
      name: z.string(),
      get children() {
        return z.array(Node)
      },
    })
    .title('Node')
  const s = toJSONSchema(Node) as any
  expect(s.$ref).toBe('#/definitions/Node')
  expect(s.definitions.Node.properties.children.items.$ref).toBe('#/definitions/Node')
})

test('cloned recursive schema is independent of the original', () => {
  const cloned = cat.clone()
  // mutating via .describe returns a new schema; the original keeps working
  cloned.describe('x')
  expect(cat.getReferences()).toEqual([])
  expect(cloned.getReferences()).toEqual([])
})
