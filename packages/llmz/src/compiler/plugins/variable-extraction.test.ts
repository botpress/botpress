import MagicString from 'magic-string'
import { describe, expect, it } from 'vitest'
import { parseScript } from '../ast.js'
import { applyVariableTracking } from './variable-extraction.js'
function transform(code: string) {
  const ms = new MagicString(code)
  const variables = new Set<string>()
  applyVariableTracking(
    {
      code,
      ms,
      ast: parseScript(code),
      comments: [],
    },
    variables
  )
  const output = ms.toString()
  parseScript(output)
  return {
    output,
    variables: [...variables],
  }
}

describe('session variable instrumentation', () => {
  it('tracks top-level declarations, including nested destructuring and rest', () => {
    const result = transform('const { a, x: { b }, ...rest } = data; const [c, [d]] = rows')
    expect(result.variables).toEqual(['a', 'b', 'rest', 'c', 'd'])
    for (const name of result.variables) {
      expect(result.output).toContain(`__var__("${name}"`)
    }
  })
  it('excludes block temporaries and function parameters', () => {
    const result = transform(
      'const account = {}; function f(account) { let inner = 2; account = inner }; if (true) { const temp = 2 }; const f2 = (param) => param'
    )
    expect(result.variables).toEqual(['account', 'f2'])
    expect(result.output).not.toContain('__var__("param"')
    expect(result.output).not.toContain('__var__("inner"')
    expect(result.output).not.toContain('__var__("temp"')
    expect(result.output).not.toContain('__var__("account", () => eval("account"), (account = inner)')
  })
  it('captures writes to outer bindings inside closures and preserves updates', () => {
    const result = transform('let count = 1; const f = () => count++; count = 1; state.value = 2')
    expect(result.output).toContain('(count++)')
    expect(result.output).toContain('(count = 1)')
    expect(result.output).toContain('__var__("state"')
    expect(result.output).toContain('"mutation"')
  })

  it('discovers function-scoped var bindings in blocks and loop headers', () => {
    const result = transform(`
      if (true) { var count = 2; }
      for (var index = 0; index < 2; index++) {}
      for (var { id, ...rest } of rows) { let temporary = id; }
      for (var key in record) continue;
      if (false) var unused;
    `)
    expect(result.variables).toEqual(['count', 'index', 'id', 'rest', 'key', 'unused'])
    for (const name of result.variables) {
      expect(result.output).toContain(`__var__("${name}"`)
    }

    expect(result.output).not.toContain('__var__("temporary"')
  })

  it('keeps var bindings inside functions and class static blocks private', () => {
    const result = transform(`
      function f() { if (true) { var privateFunction = 1; } }
      const callback = () => { var privateCallback = 2; };
      class Example { static { var privateStatic = 3; privateStatic++; } }
    `)
    expect(result.variables).toEqual(['callback'])
    expect(result.output).not.toMatch(/__var__\("private/)
  })

  it('rejects reserved bindings and writes', () => {
    for (const code of [
      'const $return = 1',
      '$return = 1',
      '$iterations[0] = 1',
      'function f($return) {}',
      'const exit = () => {}',
      'inspect = () => {}',
      'chat.send = () => {}',
      'function shadow(chat) {}',
    ]) {
      expect(() => transform(code)).toThrow(/runtime memory/)
    }
  })
})
