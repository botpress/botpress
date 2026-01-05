import { expect, describe, it } from 'vitest'
import {
  toTypeArgumentName,
  primitiveToTypescriptValue,
  unknownToTypescriptValue,
  getMultilineComment,
  escapeString,
} from './utils'

describe.concurrent('primitiveToTypscriptLiteral', () => {
  it('converts a string to a valid typescript string value', () => {
    const input: string = 'hello'
    const tsValue: string = primitiveToTypescriptValue(input)
    const actual = eval(tsValue)
    expect(typeof actual).toEqual('string')
    expect(actual).toEqual(input)
  })
  it('converts a number to a valid typescript number value', () => {
    const input: number = 42
    const tsValue: string = primitiveToTypescriptValue(input)
    const actual = eval(tsValue)
    expect(typeof actual).toEqual('number')
    expect(actual).toEqual(input)
  })
  it('converts a boolean to a valid typescript boolean value', () => {
    const input: boolean = true
    const tsValue: string = primitiveToTypescriptValue(input)
    const actual = eval(tsValue)
    expect(typeof actual).toEqual('boolean')
    expect(actual).toEqual(input)
  })
  it('converts a null to a valid typescript null value', () => {
    const input = null
    const tsValue: string = primitiveToTypescriptValue(input)
    const actual = eval(tsValue)
    expect(typeof actual).toEqual('object') // null is an object in javascript
    expect(actual).toEqual(input)
  })
  it('converts a symbol with name to a valid typescript symbol value', () => {
    const input: symbol = Symbol('hello')
    const tsValue: string = primitiveToTypescriptValue(input)
    const actual = eval(tsValue)
    expect(typeof actual).toEqual('symbol')
    expect(actual.description).toEqual(input.description)
  })
  it('converts a symbol without name to a valid typescript symbol value', () => {
    const input: symbol = Symbol()
    const tsValue: string = primitiveToTypescriptValue(input)
    const actual = eval(tsValue)
    expect(typeof actual).toEqual('symbol')
    expect(actual.description).toEqual(input.description)
  })
  it('converts a undefined to a valid typescript undefined value', () => {
    const input: undefined = undefined
    const tsValue: string = primitiveToTypescriptValue(input)
    const actual = eval(tsValue)
    expect(typeof actual).toEqual('undefined')
    expect(actual).toEqual(input)
  })
  it('converts a bigint to a valid typescript bigint value', () => {
    const input: bigint = BigInt(42)
    const tsValue: string = primitiveToTypescriptValue(input)
    const actual = eval(tsValue)
    expect(typeof actual).toEqual('bigint')
    expect(actual).toEqual(input)
  })
})

describe.concurrent('toTypeArgumentName', () => {
  it('converts a valid key to a property key', () => {
    expect(toTypeArgumentName('T')).toBe('T')
    expect(toTypeArgumentName('TName')).toBe('TName')
  })

  it('converts an invalid key to a property key', () => {
    expect(toTypeArgumentName('T-Name')).toBe('TName')
    expect(toTypeArgumentName('t Name')).toBe('TName')
    expect(toTypeArgumentName('#/t/Name')).toBe('TName')
  })
})

describe.concurrent('unknownToTypescriptValue', () => {
  const evalAndExtract = (tsValue: string) => {
    try {
      return eval(`const x = ${tsValue}; x`)
    } catch (thrown: unknown) {
      throw new Error(`Failed to eval ${tsValue}`, { cause: thrown })
    }
  }

  it.each([[1, 2, 3], [1, 2, ['a', 'b']], { a: 1, b: 2, c: { d: 3, e: [1] } }, 'foo bar', false, null])(
    'converts %s to a valid typescript value',
    (...input: unknown[]) => {
      // Act
      const tsValue: string = unknownToTypescriptValue(input)

      // Assert
      const actual = evalAndExtract(tsValue)
      expect(actual).toEqual(input)
    },
  )
})

describe('getMultilineComment', () => {
  it('single-lines', async () => {
    expect(getMultilineComment(`Hello`)).toMatchInlineSnapshot(`"/** Hello */"`)
    expect(getMultilineComment(`* Hello *`)).toMatchInlineSnapshot(`"/** * Hello * */"`)
    expect(getMultilineComment(`/** Hello */`)).toMatchInlineSnapshot(`"/**  Hello  */"`)
    expect(getMultilineComment(`Hello */ world`)).toMatchInlineSnapshot(`"/** Hello *\\/ world */"`)
    expect(getMultilineComment(`🙌 works`)).toMatchInlineSnapshot(`"/** 🙌 works */"`)
    expect(
      getMultilineComment('Hello ' + String.fromCharCode('*'.charCodeAt(0), '/'.charCodeAt(0)) + ' world'),
    ).toMatchInlineSnapshot(`"/** Hello *\\/ world */"`)
  })

  it('multi-lines', async () => {
    expect(
      getMultilineComment(
        `
Hello
World`.trim(),
      ),
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
*up`.trim(),
      ),
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
World */`.trim(),
      ),
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
`),
    ).toMatch(`"\\n\`\`\`\\nHey world\\n\`\`\`\\n"`)
  })
})
