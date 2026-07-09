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
