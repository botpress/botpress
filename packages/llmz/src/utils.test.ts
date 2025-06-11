import { transforms, z } from '@bpinternal/zui'
import { beforeAll, describe, expect, it } from 'vitest'

import { getTypings } from './typings.js'
import {
  Tokens,
  awaitObject,
  convertObjectToZuiLiterals,
  escapeString,
  getMultilineComment,
  init,
  isValidSchema,
  stripInvalidIdentifiers,
  toValidObjectName,
} from './utils.js'
import { JSONSchema7 } from 'json-schema'

describe('Tokens', () => {
  beforeAll(async () => {
    await init()
  })

  it('min works', () => {
    expect(() => Tokens(2, 10).parse('a')).toThrow(/min/i)
  })

  it('max works', () => {
    expect(() => Tokens(1, 3).parse('a b c d')).toThrow(/max/i)
  })

  it('in range works', () => {
    expect(Tokens(1, 5).parse('a b c')).toBe('a b c')
  })
})

describe('Escape String', () => {
  it('escapes a string containing nothing special', () => {
    expect(escapeString('hello')).toBe("'hello'")
  })

  it('escapes a string containing single quotes', () => {
    expect(escapeString("'hello'")).toMatchInlineSnapshot(`""\\'hello\\'""`)
  })

  it('escapes a string containing multiple lines', () => {
    expect(escapeString('hello\nworld')).toMatchInlineSnapshot(`"'hello\\nworld'"`)
  })

  it('escapes a string containing double quotes', () => {
    const world = 'world'
    expect(escapeString(`"Hey ${world}"`)).toMatchInlineSnapshot(`"'\\"Hey world\\"'"`)
  })

  it('escapes a string containing double quotes', () => {
    expect(
      escapeString(`
\`\`\`
Hey world
\`\`\`
`)
    ).toMatch(`"\\n\`\`\`\\nHey world\\n\`\`\`\\n"`)
  })
})

describe('stripInvalidIdentifiers', () => {
  it('valid array', () => {
    const obj = ['a', 'b', 'c']
    expect(stripInvalidIdentifiers(obj)).toMatchObject(obj)
  })

  it('processes array objects', () => {
    const obj = [{ '0': 1 }, 'b', 'c']
    expect(stripInvalidIdentifiers(obj)).toMatchInlineSnapshot(`
      [
        {},
        "b",
        "c",
      ]
    `)
  })

  it('processes object', () => {
    const obj = { '0': 1, a: 'b', c: 'd', 'e-f': 'g', 'Hello World': 'nope' }
    expect(stripInvalidIdentifiers(obj)).toMatchInlineSnapshot(`
      {
        "a": "b",
        "c": "d",
      }
    `)
  })
})

describe('convertObjectToZuiLiterals', () => {
  it('converts object to literals', async () => {
    const obj = { a: 'b', c: 1, d: true, e: ['f', 'g'], f: { g: 'h' } }
    const result = z.object(convertObjectToZuiLiterals(obj))
    const types = await getTypings(result)
    expect(types).toMatchInlineSnapshot(`
      "{
        a: "b"
        c: 1
        d: true
        e: ["f", "g"]
        f: {
          g: "h"
        }
      }"
    `)
  })
})

describe('isValidJsonSchema', () => {
  it('valid schema', () => {
    expect(isValidSchema({ type: 'string' })).toBe(true)
    expect(isValidSchema(transforms.toJSONSchemaLegacy(z.object({})))).toBe(true)
    expect(isValidSchema(transforms.toJSONSchemaLegacy(z.string()))).toBe(true)
    expect(isValidSchema(transforms.toJSONSchemaLegacy(z.number()))).toBe(true)
  })

  it('no type specified', () => {
    expect(isValidSchema(transforms.toJSONSchemaLegacy(z.any()))).toBe(false)
    expect(isValidSchema({ 'x-zui': {} } as JSONSchema7)).toBe(false)
    expect(isValidSchema({} as JSONSchema7)).toBe(false)
    expect(isValidSchema(null as unknown as JSONSchema7)).toBe(false)
  })
})

describe('toValidObjectName', () => {
  it('works', () => {
    expect(toValidObjectName('hello world')).toMatchInlineSnapshot(`"HelloWorld"`)
    expect(toValidObjectName('!! hello_world?')).toMatchInlineSnapshot(`"HelloWorld"`)
    expect(toValidObjectName('HELLOWorld')).toMatchInlineSnapshot(`"HELLOWorld"`)
    expect(toValidObjectName('Yoyoyo')).toMatchInlineSnapshot(`"Yoyoyo"`)
    expect(toValidObjectName('123')).toMatchInlineSnapshot(`"_123"`)
  })
})

describe('awaitObject', () => {
  it('awaits all promises in object recursively', async () => {
    const obj = {
      a: new Promise((resolve) => setTimeout(() => resolve('a'), 100)),
      b: {
        c: Promise.resolve('c'),
        d: {
          e: Promise.resolve('e'),
        },
      },
    }
    const result = await awaitObject(obj)

    expect(result).toMatchInlineSnapshot(`
      {
        "a": "a",
        "b": {
          "c": "c",
          "d": {
            "e": "e",
          },
        },
      }
    `)
  })
})

describe('getMultilineComment', () => {
  it('single-lines', async () => {
    expect(getMultilineComment(`Hello`)).toMatchInlineSnapshot(`"/** Hello */"`)
    expect(getMultilineComment(`* Hello *`)).toMatchInlineSnapshot(`"/** * Hello * */"`)
    expect(getMultilineComment(`/** Hello */`)).toMatchInlineSnapshot(`"/**  Hello  */"`)
    expect(getMultilineComment(`Hello */ world`)).toMatchInlineSnapshot(`"/** Hello *\\/ world */"`)
    expect(getMultilineComment(`🙌 works`)).toMatchInlineSnapshot(`"/** 🙌 works */"`)
    expect(
      getMultilineComment('Hello ' + String.fromCharCode('*'.charCodeAt(0), '/'.charCodeAt(0)) + ' world')
    ).toMatchInlineSnapshot(`"/** Hello *\\/ world */"`)
  })

  it('multi-lines', async () => {
    expect(
      getMultilineComment(
        `
Hello
World`.trim()
      )
    ).toMatchInlineSnapshot(`
      "/**
       * Hello
       * World
       */"
    `)

    expect(
      getMultilineComment(
        `
Hello
* world
what

is
*up`.trim()
      )
    ).toMatchInlineSnapshot(`
      "/**
       * Hello
       * world
       * what
       *
       * is
       * *up
       */"
    `)

    expect(
      getMultilineComment(
        `
Hello,
World */`.trim()
      )
    ).toMatchInlineSnapshot(`
      "/**
       * Hello,
       * World
       */"
    `)
  })

  it('empty lines', async () => {
    expect(getMultilineComment(``)).toMatchInlineSnapshot(`""`)
    expect(getMultilineComment(`\n\n  \n \n    \n`)).toMatchInlineSnapshot(`""`)
    expect(getMultilineComment(`\n\n  \n \n  .  \n`)).toMatchInlineSnapshot(`"/** . */"`)
    expect(getMultilineComment(`\n\n Hello \n \n  .  \n\nworld\n\n\n\n\n\n`)).toMatchInlineSnapshot(`
      "/**
       * Hello
       *
       * .
       *
       * world
       */"
    `)
    expect(getMultilineComment(`\n/**\n Hello \n \n \n\n \n \n\nworld\n\n\n*/\n\n\n`)).toMatchInlineSnapshot(`
      "/**
       * Hello
       *
       * world
       */"
    `)
  })
})
