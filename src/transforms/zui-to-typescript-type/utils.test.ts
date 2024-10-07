import { isValidTypescript } from '../../setup.test'
import { expect } from 'vitest'
import { escapeString, toTypeArgumentName } from './utils'

describe('Typescript Checker', () => {
  it('passes successfully on valid string definition', () => {
    const data = isValidTypescript(`const a: string = 'hello'`)

    expect(data.isValid).toBe(true)
  })

  it('fails correctly on invalid code', () => {
    const data = isValidTypescript(`const a: string = 1`)
    expect(data.isValid).toBe(false)
  })

  it('can handle Error types', () => {
    const data = isValidTypescript(`const a: Error = new Error('hello')`)
    expect(data.isValid).toBe(true)
  })

  it('can handle promises', () => {
    const data = isValidTypescript(`const a: Promise<string> = Promise.resolve('hello')`)
    expect(data.isValid).toBe(true)
  })
})

describe('test utility to validate typescript', () => {
  it('passes on valid code', () => {
    const exampleTS = `
const a: string = 'hello'
const b: number = 1
const c: string[] = ['hello']
const d: { a: string } = { a: 'hello' }
const e: { a: string }[] = [{ a: 'hello' }]`
    expect(exampleTS).toBeValidTypeScript()
  })

  it('fails on invalid code', () => {
    const invalidTS = `
const a: string = 1
const b: number = 'hello'
const c: string[] = [1]
const d: { a: string } = { a: 1 }

  })`
    expect(invalidTS).not.toBeValidTypeScript()
  })
})

describe('Escape String', () => {
  it('escapes a string containing nothing special', () => {
    expect(escapeString('hello')).toBe("'hello'")
  })

  it('escapes a string containing single quotes', () => {
    expect(escapeString("'hello'")).toMatchInlineSnapshot(`"'\\'hello\\''"`)
  })

  it('escapes a string containing double quotes', () => {
    const world = 'world'
    expect(escapeString(`"Hey ${world}"`)).toMatchInlineSnapshot(`"'"Hey world"'"`)
  })

  it('escapes a string containing double quotes', () => {
    expect(
      escapeString(`
\`\`\`
Hey world
\`\`\`
`),
    ).toMatchInlineSnapshot(`
      ""
      \`\`\`
      Hey world
      \`\`\`
      ""
    `)
  })
})

describe('toTypeArgumentName', () => {
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
