import { test, expect } from 'vitest'
import * as z from '../index'
import { toJSONSchema } from '../../transforms/zui-to-json-schema'

test('self-recursion (synthetic name): hoists to definitions, root is a $ref', () => {
  const Category = z.object({
    name: z.string(),
    get subcategories() {
      return z.array(Category)
    },
  })
  const schema = toJSONSchema(Category) as any
  expect(schema.$ref).toBe('#/definitions/Schema0')
  expect(schema.definitions.Schema0.type).toBe('object')
  expect(schema.definitions.Schema0.properties.subcategories.items.$ref).toBe('#/definitions/Schema0')
  expect(schema.definitions.Schema0.properties.name.type).toBe('string')
})

test('mutual recursion (synthetic names): back-edge hoisted, forward side inlined', () => {
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
  const schema = toJSONSchema(User) as any
  expect(schema.$ref).toBe('#/definitions/Schema0')
  const userDef = schema.definitions.Schema0
  const postInline = userDef.properties.posts.items
  expect(postInline.type).toBe('object')
  expect(postInline.properties.author.$ref).toBe('#/definitions/Schema0')
})

test('self-recursion with a title uses the title as the definition name', () => {
  const Category: any = z
    .object({
      name: z.string(),
      get subcategories() {
        return z.array(Category)
      },
    })
    .title('Category')
  const schema = toJSONSchema(Category) as any
  expect(schema.$ref).toBe('#/definitions/Category')
  expect(schema.definitions.Category.properties.subcategories.items.$ref).toBe('#/definitions/Category')
})

test('titled mutual recursion: back-edge hoisted under its title, forward side inlined', () => {
  const User: any = z
    .object({
      email: z.string(),
      get posts() {
        return z.array(Post)
      },
    })
    .title('User')
  const Post: any = z
    .object({
      title: z.string(),
      get author() {
        return User
      },
    })
    .title('Post')
  const schema = toJSONSchema(User) as any
  expect(schema.$ref).toBe('#/definitions/User')
  expect(schema.definitions.User.properties.posts.items.properties.author.$ref).toBe('#/definitions/User')
})

test('non-recursive schema is unchanged (no definitions block)', () => {
  const Plain = z.object({ a: z.string(), b: z.number().optional() })
  const schema = toJSONSchema(Plain) as any
  expect('definitions' in schema).toBe(false)
  expect(schema.type).toBe('object')
  expect(schema.required).toEqual(['a'])
})

test('recursive schema produces finite serializable JSON', () => {
  const Category = z.object({
    name: z.string(),
    get subcategories() {
      return z.array(Category)
    },
  })
  const json = JSON.stringify(toJSONSchema(Category))
  expect(json).toContain('#/definitions/Schema0')
})
