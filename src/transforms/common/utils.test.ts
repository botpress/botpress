import { isValidTypescript } from '../../setup.test'
import { expect } from 'vitest'
import { toTypeArgumentName, primitiveToTypescriptValue } from './utils'

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

describe('primitiveToTypscriptLiteral', () => {
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
    const input: null = null
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
