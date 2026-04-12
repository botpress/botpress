import { describe, it, expect, assert } from 'vitest'
import { isJsonFile, validateOrRepairJson } from '../src/json-utils'

describe('json-utils', () => {
  describe('isJsonFile', () => {
    it('detects .json extension from path', () => {
      expect(isJsonFile('config.json', 'config.json')).toBe(true)
      expect(isJsonFile('src/data/config.json', 'config.json')).toBe(true)
      expect(isJsonFile('package.json', 'package.json')).toBe(true)
    })

    it('detects .json extension from name when path differs', () => {
      expect(isJsonFile('/some/path/file', 'file.json')).toBe(true)
    })

    it('rejects non-json files', () => {
      expect(isJsonFile('src/hello.ts', 'hello.ts')).toBe(false)
      expect(isJsonFile('readme.md', 'readme.md')).toBe(false)
      expect(isJsonFile('data.jsonl', 'data.jsonl')).toBe(false)
      expect(isJsonFile('config.yaml', 'config.yaml')).toBe(false)
    })

    it('rejects files with json in the name but not as extension', () => {
      expect(isJsonFile('json-parser.ts', 'json-parser.ts')).toBe(false)
      expect(isJsonFile('myjsonfile.txt', 'myjsonfile.txt')).toBe(false)
    })
  })

  describe('validateOrRepairJson', () => {
    // --- valid JSON ---

    it('accepts a valid JSON object', () => {
      const result = validateOrRepairJson('{"name": "test", "value": 42}')
      assert(result.valid)
      expect(result.data).toEqual({ name: 'test', value: 42 })
      expect(result.repaired).toBe(false)
    })

    it('accepts a valid JSON array', () => {
      const result = validateOrRepairJson('[1, 2, 3]')
      assert(result.valid)
      expect(result.data).toEqual([1, 2, 3])
    })

    it('accepts JSON primitives', () => {
      for (const [input, expected] of [
        ['"hello"', 'hello'],
        ['42', 42],
        ['true', true],
        ['null', null],
      ] as const) {
        const result = validateOrRepairJson(input)
        assert(result.valid)
        expect(result.data).toEqual(expected)
      }
    })

    it('accepts pretty-printed JSON', () => {
      const content = JSON.stringify({ name: 'app', version: '1.0.0' }, null, 2)
      const result = validateOrRepairJson(content)
      assert(result.valid)
      expect(result.data).toEqual({ name: 'app', version: '1.0.0' })
      expect(result.repaired).toBe(false)
      expect(result.content).toBe(content)
    })

    it('accepts complex nested JSON', () => {
      const content = JSON.stringify(
        {
          database: { host: 'localhost', port: 5432, pool: { min: 2, max: 10 } },
          features: ['auth', 'logging'],
        },
        null,
        2
      )
      const result = validateOrRepairJson(content)
      assert(result.valid)
      expect(result.repaired).toBe(false)
    })

    // --- repairable JSON ---

    it('repairs missing quotes on keys', () => {
      const result = validateOrRepairJson('{name: "test"}')
      assert(result.valid)
      expect(result.repaired).toBe(true)
      expect(result.data).toEqual({ name: 'test' })
    })

    it('repairs trailing commas', () => {
      const result = validateOrRepairJson('{"a": 1, "b": 2,}')
      assert(result.valid)
      expect(result.repaired).toBe(true)
      expect(result.data).toEqual({ a: 1, b: 2 })
    })

    it('repairs single quotes', () => {
      const result = validateOrRepairJson("{'name': 'test'}")
      assert(result.valid)
      expect(result.repaired).toBe(true)
      expect(result.data).toEqual({ name: 'test' })
    })

    it('repairs missing closing brace', () => {
      const result = validateOrRepairJson('{"name": "test"')
      assert(result.valid)
      expect(result.repaired).toBe(true)
      expect(result.data).toEqual({ name: 'test' })
    })

    it('repairs missing closing bracket in array', () => {
      const result = validateOrRepairJson('[1, 2, 3')
      assert(result.valid)
      expect(result.repaired).toBe(true)
      expect(result.data).toEqual([1, 2, 3])
    })

    it('repairs trailing comma in nested object', () => {
      const result = validateOrRepairJson('{"app": {"name": "test",}, "version": "1.0.0"}')
      assert(result.valid)
      expect(result.repaired).toBe(true)
      expect(result.data).toEqual({ app: { name: 'test' }, version: '1.0.0' })
    })

    // --- invalid JSON (unrepairable) → formatted error ---

    it('returns a formatted error with line numbers when unrepairable', () => {
      const result = validateOrRepairJson('{}{}{}')
      assert(!result.valid)
      expect(result.error).toContain('JSON Syntax Error:')
      expect(result.error).toMatch(/\d+\|/)
    })

    it('returns an error marking the exact error line and column', () => {
      // jsonrepair cannot fix multiple adjacent root-level braced objects without content
      const content = '{\n  "a": 1\n}{'
      const result = validateOrRepairJson(content)
      assert(!result.valid)
      expect(result.error).toContain('← ERROR')
      expect(result.error).toContain('^')
    })
  })
})
