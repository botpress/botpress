import { test, expect } from 'vitest'
import * as z from '../index'
import { toJSONSchema } from '../../transforms/zui-to-json-schema'
import { toTypescriptType } from '../../transforms/zui-to-typescript-type'
import { toTypescriptSchema } from '../../transforms/zui-to-typescript-schema'

// --- self recursion ---
const Category = z.object({
  name: z.string(),
  get subcategories() {
    return z.array(Category)
  },
})
type Category = z.infer<typeof Category>

// --- mutual recursion ---
const User = z.object({
  email: z.string(),
  get posts() {
    return z.array(Post)
  },
})
const Post = z.object({
  title: z.string(),
  get author() {
    return User
  },
})

test('parse: self recursion', () => {
  const result = Category.parse({ name: 'root', subcategories: [{ name: 'child', subcategories: [] }] })
  expect(result.name).toBe('root')
})

test('parse: mutual recursion', () => {
  const result = User.parse({
    email: 'a@b.com',
    posts: [{ title: 't', author: { email: 'a@b.com', posts: [] } }],
  })
  expect(result.email).toBe('a@b.com')
})

test('getReferences: self recursion does not stack overflow', () => {
  expect(Category.getReferences()).toEqual([])
})

test('getReferences: mutual recursion does not stack overflow', () => {
  expect(User.getReferences()).toEqual([])
})

test('clone: self recursion does not stack overflow', () => {
  const cloned = Category.clone()
  expect(cloned).toBeTruthy()
})

test('clone: mutual recursion does not stack overflow', () => {
  const cloned = User.clone()
  expect(cloned).toBeTruthy()
})

test('dereference: self recursion does not stack overflow', () => {
  const deref = Category.dereference({})
  expect(deref).toBeTruthy()
})

test('dereference: mutual recursion does not stack overflow', () => {
  const deref = User.dereference({})
  expect(deref).toBeTruthy()
})

test('isEqual: self recursion does not stack overflow', () => {
  expect(Category.isEqual(Category)).toBe(true)
})

test('isEqual: mutual recursion does not stack overflow', () => {
  expect(User.isEqual(User)).toBe(true)
})

test('toJSONSchema: self recursion does not stack overflow', () => {
  const schema = toJSONSchema(Category)
  expect(schema).toBeTruthy()
})

test('toJSONSchema: mutual recursion does not stack overflow', () => {
  const schema = toJSONSchema(User)
  expect(schema).toBeTruthy()
})

test('toTypescriptType: self recursion does not stack overflow', () => {
  const ts = toTypescriptType(Category)
  expect(ts).toBeTruthy()
})

test('toTypescriptType: mutual recursion does not stack overflow', () => {
  const ts = toTypescriptType(User)
  expect(ts).toBeTruthy()
})

test('toTypescriptSchema: self recursion does not stack overflow', () => {
  const ts = toTypescriptSchema(Category)
  expect(ts).toBeTruthy()
})

test('toTypescriptSchema: mutual recursion does not stack overflow', () => {
  const ts = toTypescriptSchema(User)
  expect(ts).toBeTruthy()
})

test('probe: what happens at runtime if a shape value is not a real schema', () => {
  const Bad = z.object({
    name: z.string(),
    // @ts-expect-error - intentionally not wrapped in z.number(), simulating the typo
    age: 42,
  })
  try {
    Bad.parse({ name: 'x', age: 42 })
    expect(true).toBe(false) // should not reach here
  } catch (e) {
    console.log('ACTUAL ERROR THROWN:', (e as Error).message)
  }
})
