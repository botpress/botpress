import { describe, expect, test } from 'vitest'

import { compile } from '../compiler.js'

describe('unsupported dynamic code generation', () => {
  test.each([
    'eval("exit();")',
    '(0, eval)("exit();")',
    'const run = eval; run("exit();")',
    'new Function("exit();")',
    'const make = Function; make("exit();")',
    'globalThis.eval("exit();")',
    'const make = globalThis["Function"]; make("exit();")',
    'const { Function: make } = globalThis; make("exit();")',
    'const scope = globalThis; const alias = scope; alias.Function("exit();")',
    '(function () {}).constructor("exit();")',
    '(async () => {}).constructor("exit();")',
    '(function* () {}).constructor("exit();")',
    '(async function* () {}).constructor("exit();")',
    'const make = (() => {}).constructor; const alias = make; alias("exit();")',
    'let make; make = (() => {}).constructor; new make("exit();")',
    'const { constructor: make } = () => {}; make("exit();")',
    '(() => {}).constructor.call(null, "exit();")',
    '(() => {}).constructor.bind(null, "exit();")',
  ])('rejects %s before execution', (source) => {
    expect(() => compile(source)).toThrow(/Dynamic code generation is not supported/)
  })

  test.each([
    'const data = { constructor: "record", Function: 42 }; return data.constructor;',
    'const name = account["constructor"]; return name;',
    'const constructor = "record"; return { constructor };',
    'function finish() { return 42; } return finish();',
  ])('allows ordinary data and compiled functions: %s', (source) => {
    expect(() => compile(source)).not.toThrow()
  })
})
