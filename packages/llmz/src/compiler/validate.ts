import { type PluginObj, types as t } from '@babel/core'
import * as Babel from '@babel/standalone'

import { type ObjectInstance } from '../objects.js'
import { type Tool } from '../tool.js'
import { getErrorMessage } from '../utils.js'
import { compile } from './compiler.js'

/**
 * Standard JavaScript globals available inside the VM sandbox. Referencing any of
 * these is always valid, so they are never reported as unknown identifiers.
 * Intentionally excludes host globals that the sandbox does NOT provide
 * (`console`, `setTimeout`, `setInterval`, `require`, `import`, `fetch`, ...).
 */
const BUILTIN_GLOBALS = new Set<string>([
  'globalThis',
  'undefined',
  'NaN',
  'Infinity',
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'Symbol',
  'BigInt',
  'Math',
  'JSON',
  'Date',
  'RegExp',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Promise',
  'Proxy',
  'Reflect',
  'Error',
  'EvalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError',
  'ArrayBuffer',
  'DataView',
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'encodeURI',
  'decodeURI',
  'encodeURIComponent',
  'decodeURIComponent',
  'structuredClone',
  'Intl',
])

/**
 * The result of validating a block of generated code.
 */
export type CodeValidationResult = {
  valid: boolean
  /** Human-readable descriptions of every problem found (empty when `valid`). */
  errors: string[]
}

/**
 * Collects the identifiers that a block of code references but never declares
 * (its "free" identifiers) using Babel's scope analysis.
 *
 * These are exactly the names the code expects to find in its surrounding scope:
 * tools, objects/variables, and JS built-ins. Locally declared variables, function
 * parameters and TypeScript-only type references are bound (or erased) and therefore
 * never appear here. JSX component tags (e.g. `<Text>`) are excluded — they are
 * components, not variable references, and are validated separately.
 */
export function collectFreeIdentifiers(code: string): Set<string> {
  const found = new Set<string>()
  const jsxNames = new Set<string>()

  const collectPlugin = (): PluginObj => ({
    name: 'collect-free-identifiers',
    visitor: {
      JSXOpeningElement(path) {
        // Record the root identifier of the tag (`Foo` in `<Foo>` or `<Foo.Bar>`).
        let name = path.node.name
        while (t.isJSXMemberExpression(name)) {
          name = name.object
        }
        if (t.isJSXIdentifier(name)) {
          jsxNames.add(name.name)
        }
      },
      Program: {
        exit(path) {
          for (const name of Object.keys(path.scope.globals)) {
            if (!jsxNames.has(name)) {
              found.add(name)
            }
          }
        },
      },
    },
  })

  Babel.transform(code, {
    presets: [['typescript', { isTSX: true, allExtensions: true }]],
    plugins: [collectPlugin],
    parserOpts: {
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
    },
    filename: '<anonymous>.tsx',
    // We only need scope analysis, not generated output.
    code: false,
  })

  return found
}

/**
 * Builds the set of identifiers the generated code is allowed to reference at the
 * top level: every global tool (and its aliases), every object namespace, and the
 * JS built-ins available in the sandbox.
 *
 * Object properties and object-scoped tools are accessed as `object.member`, so only
 * the `object` name needs to be allowed here — the member is not a free identifier.
 */
export function getAllowedReferences(tools: Tool[], objects: ObjectInstance[]): Set<string> {
  const allowed = new Set<string>(BUILTIN_GLOBALS)

  for (const tool of tools) {
    allowed.add(tool.name)
    for (const alias of tool.aliases ?? []) {
      allowed.add(alias)
    }
  }

  for (const object of objects) {
    allowed.add(object.name)
  }

  return allowed
}

/**
 * Lightweight, dependency-free validation of a block of generated code.
 *
 * Two checks, both using logic/libraries already bundled in LLMz:
 * 1. **Compiles** — the code parses and compiles the same way the VM would run it
 *    (reuses {@link compile}); a failure here means the code could never run.
 * 2. **Valid references** — every tool, object and variable the code references
 *    actually exists (via free-identifier analysis against the available tools,
 *    objects and JS built-ins); catches calls to tools that were not provided and
 *    references to variables/objects that don't exist.
 *
 * This intentionally does NOT type-check (matching tool argument shapes, property
 * types, etc.), which would require a full TypeScript type-checker.
 */
export function validateGeneratedCode(
  code: string,
  { tools, objects }: { tools: Tool[]; objects: ObjectInstance[] }
): CodeValidationResult {
  // 1. Does it compile / would it run?
  try {
    compile(code)
  } catch (err: unknown) {
    return {
      valid: false,
      errors: [`The code does not compile and cannot run: ${getErrorMessage(err)}`],
    }
  }

  // 2. Are all referenced tools/variables/objects available?
  let freeIdentifiers: Set<string>
  try {
    freeIdentifiers = collectFreeIdentifiers(code)
  } catch {
    // Best-effort: if reference analysis fails, don't block on it — the code
    // already compiled above.
    return { valid: true, errors: [] }
  }

  const allowed = getAllowedReferences(tools, objects)
  const errors: string[] = []

  for (const identifier of freeIdentifiers) {
    if (!allowed.has(identifier)) {
      errors.push(`"${identifier}" is used but is not an available tool, object, or variable.`)
    }
  }

  return { valid: errors.length === 0, errors }
}
