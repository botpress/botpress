import { describe, expect, test } from 'vitest'

import { ObjectInstance } from '../objects.js'
import { Tool } from '../tool.js'
import { collectFreeIdentifiers, getAllowedReferences, validateGeneratedCode } from './validate.js'

const summarize = new Tool({ name: 'summarize', handler: async () => ({}) })
const search = new Tool({ name: 'search', aliases: ['find'], handler: async () => ({}) })
const user = new ObjectInstance({ name: 'user', tools: [], properties: [] })

const validate = (code: string) => validateGeneratedCode(code, { tools: [summarize, search], objects: [user] })

describe('collectFreeIdentifiers', () => {
  test('reports referenced-but-undeclared identifiers, not local declarations', () => {
    const ids = collectFreeIdentifiers(`const x = foo(); const y = x + bar; return { x, y }`)
    expect(ids.has('foo')).toBe(true)
    expect(ids.has('bar')).toBe(true)
    expect(ids.has('x')).toBe(false)
    expect(ids.has('y')).toBe(false)
  })

  test('does not treat JSX component tags as identifier references', () => {
    const ids = collectFreeIdentifiers(`return <Text>hello {name}</Text>`)
    expect(ids.has('Text')).toBe(false)
    expect(ids.has('name')).toBe(true)
  })
})

describe('getAllowedReferences', () => {
  test('includes tool names, aliases, object names and builtins', () => {
    const allowed = getAllowedReferences([summarize, search], [user])
    expect(allowed.has('summarize')).toBe(true)
    expect(allowed.has('find')).toBe(true) // alias
    expect(allowed.has('user')).toBe(true)
    expect(allowed.has('Math')).toBe(true) // builtin
    expect(allowed.has('console')).toBe(false) // not provided by the sandbox
  })
})

describe('validateGeneratedCode', () => {
  test('accepts code that compiles and only references available tools/objects/builtins', () => {
    const result = validate(`
      const summary = await summarize({ text: user.name })
      const n = Math.max(1, 2)
      return { action: 'done', value: { success: true, result: { summary, n } } }
    `)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  test('rejects code that calls a tool that was not provided', () => {
    const result = validate(`
      const t = await translate({ text: 'hi' })
      return { action: 'done', value: { success: true, result: t } }
    `)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('translate')
  })

  test('rejects code that references an unknown object/variable', () => {
    const result = validate(`return { action: 'done', value: { success: true, result: account.id } }`)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('account')
  })

  test('rejects code that does not compile', () => {
    const result = validate(`const x = = ;`)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ').toLowerCase()).toContain('compile')
  })

  test('accepts an alias used to call a tool', () => {
    const result = validate(`
      const r = await find({ q: 'x' })
      return { action: 'done', value: { success: true, result: r } }
    `)
    expect(result.valid).toBe(true)
  })
})
