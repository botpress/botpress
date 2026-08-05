import { test, expect } from 'vitest'
import * as z from '../index'

interface Category {
  name: string
  subcategories: Category[]
}

const testCategory: Category = {
  name: 'I',
  subcategories: [
    {
      name: 'A',
      subcategories: [
        {
          name: '1',
          subcategories: [
            {
              name: 'a',
              subcategories: [],
            },
          ],
        },
      ],
    },
  ],
}

test('recursion with lazy object', () => {
  const Category: z.ZodType<Category> = z.lazy(() =>
    z.object({
      name: z.string(),
      subcategories: z.array(Category),
    })
  )
  Category.parse(testCategory)
})

test('recursion with z.lazy', () => {
  const Category: z.ZodType<Category> = z.lazy(() =>
    z.object({
      name: z.string(),
      subcategories: z.array(Category),
    })
  )
  Category.parse(testCategory)
})

test('schema getter', () => {
  z.lazy(() => z.string()).schema.parse('asdf')
})

type LinkedList = null | { value: number; next: LinkedList }

const linkedListExample = {
  value: 1,
  next: {
    value: 2,
    next: {
      value: 3,
      next: {
        value: 4,
        next: null,
      },
    },
  },
}

test('recursion involving union type', () => {
  const LinkedListSchema: z.ZodType<LinkedList> = z.lazy(() =>
    z.union([
      z.null(),
      z.object({
        value: z.number(),
        next: LinkedListSchema,
      }),
    ])
  )
  LinkedListSchema.parse(linkedListExample)
})

test('getReferences does not stack overflow on a self-referential lazy schema', () => {
  type TreeNode = { name: string; children?: TreeNode[] }
  const treeNode: z.ZodType<TreeNode> = z.lazy(() =>
    z.object({ name: z.string(), children: z.array(treeNode).optional() })
  )
  const recursive = z.object({ tree: z.array(treeNode) })

  expect(recursive.getReferences()).toEqual([])
})

test('getReferences finds refs reachable through a self-referential lazy schema', () => {
  type TreeNode = { name: string; tag: unknown; children?: TreeNode[] }
  const treeNode: z.ZodType<TreeNode> = z.lazy(() =>
    z.object({ name: z.string(), tag: z.ref('Tag'), children: z.array(treeNode).optional() })
  )

  expect(treeNode.getReferences()).toEqual(['Tag'])
})

test('getReferences does not stack overflow on mutual recursion between two distinct lazy schemas', () => {
  let A: z.ZodType<any> = z.lazy(() => z.object({ b: B }))
  let B: z.ZodType<any> = z.lazy(() => z.object({ a: A }))

  expect(A.getReferences()).toEqual([])
})

test('getReferences finds refs reachable only by crossing to the other side of a mutual recursion', () => {
  let A: z.ZodType<any> = z.lazy(() => z.object({ tagA: z.ref('TagA'), b: B }))
  let B: z.ZodType<any> = z.lazy(() => z.object({ tagB: z.ref('TagB'), a: A }))

  expect(A.getReferences().sort()).toEqual(['TagA', 'TagB'])
})

test('getReferences does not stack overflow on a 3-node mutual recursion cycle', () => {
  let A: z.ZodType<any> = z.lazy(() => z.object({ b: B }))
  let B: z.ZodType<any> = z.lazy(() => z.object({ c: C }))
  let C: z.ZodType<any> = z.lazy(() => z.object({ a: A }))

  expect(A.getReferences()).toEqual([])
})

test('getReferences only expands a shared lazy schema once, even when referenced from multiple places', () => {
  let calls = 0
  const treeNode: z.ZodType<any> = z.lazy(() => {
    calls++
    return z.object({ tag: z.ref('Tag'), children: z.array(treeNode).optional() })
  })
  const schema = z.object({ a: treeNode, b: treeNode, c: treeNode })

  expect(schema.getReferences()).toEqual(['Tag'])
  // 3 occurrences of the same lazy schema, but its getter should only run once — the rest are memoized
  expect(calls).toBe(1)
})
