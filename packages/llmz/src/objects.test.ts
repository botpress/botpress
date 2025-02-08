import { describe, it, expect, beforeAll } from 'vitest'
import { z } from '@bpinternal/zui'

import { ObjectInstance, getObjectTypings, makeObject } from './objects.js'
import { init } from './utils.js'
import { Tool } from './tool.js'

describe('Objects', () => {
  beforeAll(async () => {
    await init()
  })

  it('minimum viable object', () => {
    makeObject({
      name: 'add',
    })
  })

  it('with description', () => {
    makeObject({
      name: 'add',
      description: 'Adds two numbers',
    })
  })

  it('name is assignable', () => {
    expect(() =>
      makeObject({
        name: 'add numbers',
      })
    ).toThrow(/name/i)
  })

  it('cant duplicate ', () => {
    const obj = makeObject({
      name: 'add',
    })
    expect(() => ObjectInstance.parse({ ...obj })).toThrow(/makeObject/i)
  })
})

describe('Object typings', () => {
  beforeAll(async () => {
    await init()
  })

  it('simple object with no properties', async () => {
    const obj = makeObject({
      name: 'MyObject',
    })

    const typings = await getObjectTypings(obj).withProperties().withTools().build()

    expect(typings).toMatchInlineSnapshot(`"export namespace MyObject {}"`)
  })

  it('some basic properties', async () => {
    const obj = makeObject({
      name: 'MyObject',
      properties: [
        { name: 'age', value: 20 },
        { name: 'name', value: 'John Smith' },
        { name: 'isAlive', value: true },
        { name: 'isDead', value: false },
        { name: 'nothing', value: null },
        { name: 'empty', value: undefined },
        { name: 'emptyString', value: '' },
        { name: 'emptyArray', value: [] },
        { name: 'emptyObject', value: {} },
        { name: 'simpleObject', value: { a: 1 } },
        { name: 'simpleArray', value: [1, 2, 3] },
      ],
    })

    const typings = await getObjectTypings(obj).withProperties().withTools().build()

    expect(typings).toMatchInlineSnapshot(`
      "export namespace MyObject {
        // ---------------- //
        //    Properties    //
        // ---------------- //

        const age: Readonly<number> = 20
        const name: Readonly<string> = "John Smith"
        const isAlive: Readonly<boolean> = true
        const isDead: Readonly<boolean> = false
        const nothing: Readonly<object> = null
        const empty: Readonly<unknown> = undefined
        const emptyString: Readonly<string> = ""
        const emptyArray: Readonly<object> = []
        const emptyObject: Readonly<object> = {}
        const simpleObject: Readonly<object> = { a: 1 }
        const simpleArray: Readonly<object> = [1, 2, 3]
      } // end namespace "MyObject""
    `)
  })

  it('with tools', async () => {
    const obj = makeObject({
      name: 'MyObject',
      description: 'This is a test object.\nThis is a second line.',
      tools: [
        new Tool({
          name: 'add',
          description: 'Adds two numbers',
          input: z.object({
            a: z.number(),
            b: z.number(),
          }),
          output: z.number(),
          handler: async ({ a, b }) => a + b,
        }),
      ],
    })

    const typings = await getObjectTypings(obj).withProperties().withTools().build()

    expect(typings).toMatchInlineSnapshot(`
      "/**
       * This is a test object.
       * This is a second line.
       */
      export namespace MyObject {
        // ---------------- //
        //       Tools      //
        // ---------------- //

        /** Adds two numbers */
        function add(args: { a: number; b: number }): number
      }"
    `)
  })

  it('with tools and properties', async () => {
    const obj = makeObject({
      name: 'MyObject',
      properties: [
        { name: 'age', value: 20 },
        { name: 'name', value: 'John Smith' },
      ],
      tools: [
        new Tool({
          name: 'add',
          description: 'Adds two numbers',
          input: z.object({
            a: z.number(),
            b: z.number(),
          }),
          output: z.number(),
          handler: async ({ a, b }) => a + b,
        }),
      ],
    })

    const typings = await getObjectTypings(obj).withProperties().withTools().build()

    expect(typings).toMatchInlineSnapshot(`
      "export namespace MyObject {
        // ---------------- //
        //    Properties    //
        // ---------------- //

        const age: Readonly<number> = 20
        const name: Readonly<string> = "John Smith"

        // ---------------- //
        //       Tools      //
        // ---------------- //

        /** Adds two numbers */
        function add(args: { a: number; b: number }): number
      } // end namespace "MyObject""
    `)
  })

  it('object with invalid identifier property', async () => {
    const typings = () =>
      getObjectTypings(
        makeObject({
          name: 'MyObject',
          properties: [{ name: 'Age of the user!', value: 20 }],
        })
      )
        .withProperties()
        .withTools()
        .build()

    expect(typings).toThrow()
  })

  it('object with read/write properties', async () => {
    const obj = makeObject({
      name: 'MyObject',
      properties: [
        { name: 'AgeOfUser', value: 20, writable: true },
        { name: 'name', value: 'john', writable: true },
        { name: 'nationality', value: 'canada', writable: false },
      ],
    })

    const typings = await getObjectTypings(obj).withProperties().withTools().build()

    expect(typings).toMatchInlineSnapshot(`
      "export namespace MyObject {
        // ---------------- //
        //    Properties    //
        // ---------------- //

        const AgeOfUser: Writable<number> = 20
        const name: Writable<string> = "john"
        const nationality: Readonly<string> = "canada"
      }"
    `)
  })

  it('object properties with schema defined has typings inlined', async () => {
    const obj = makeObject({
      name: 'MyObject',
      properties: [
        { name: 'AgeOfUser', value: 20, type: z.number() },
        { name: 'name', type: z.string(), writable: true },
        {
          name: 'address',
          value: { street: '123 Main St', city: 'Toronto' },
          type: z.object({
            street: z.string(),
            city: z.string(),
          }),
          writable: false,
        },
      ],
    })

    const typings = await getObjectTypings(obj).withProperties().withTools().build()

    expect(typings).toMatchInlineSnapshot(`
      "export namespace MyObject {
        // ---------------- //
        //    Properties    //
        // ---------------- //

        const AgeOfUser: Readonly<number> = 20
        const name: Writable<string> = undefined
        const address: Readonly<{
          street: string
          city: string
        }> = { street: "123 Main St", city: "Toronto" }
      }"
    `)
  })

  it('e2e with value, types and writable', async () => {
    const obj = makeObject({
      name: 'MyObject',
      properties: [
        { name: 'test1', type: z.array(z.string()), value: ['a', 'b'] },
        { name: 'test2', type: z.array(z.string()) },
        { name: 'test3', type: z.array(z.string()), description: 'With a description here' },
        {
          name: 'test4',
          type: z.array(z.string()),
          description: 'With a description and value here',
          value: ['a', 'b'],
        },
        {
          name: 'test5',
          type: z.array(z.string()),
          description: 'With a description and value here',
          value: ['a', 'b'],
          writable: true,
        },
      ],
      tools: [],
    })
    const typings = await getObjectTypings(obj).withProperties().withTools().build()
    expect(typings).toMatchInlineSnapshot(`
      "export namespace MyObject {
        // ---------------- //
        //    Properties    //
        // ---------------- //

        const test1: Readonly<string[]> = ["a", "b"]
        const test2: Readonly<string[]> = undefined
        /** With a description here */
        const test3: Readonly<string[]> = undefined
        /** With a description and value here */
        const test4: Readonly<string[]> = ["a", "b"]
        /** With a description and value here */
        const test5: Writable<string[]> = ["a", "b"]
      } // end namespace "MyObject""
    `)
  })
})
