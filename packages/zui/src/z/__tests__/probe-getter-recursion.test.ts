import { test, expect } from 'vitest'
import * as z from '../index'
import { toJSONSchema } from '../../transforms/zui-to-json-schema'
import { toTypescriptType } from '../../transforms/zui-to-typescript-type'
import { toTypescriptSchema } from '../../transforms/zui-to-typescript-schema'
import { execFileSync } from 'node:child_process'
import * as path from 'node:path'
import { Bad } from './fixtures/non-schema-shape-value.fixture'

// --- self recursion ---
const Category = z.object({
  name: z.string(),
  get subcategories() {
    return z.array(Category)
  },
})
type Category = z.infer<typeof Category>

// --- mutual recursion ---
const User = z.object({
  email: z.string(),
  get posts() {
    return z.array(Post)
  },
})
const Post = z.object({
  title: z.string(),
  get author() {
    return User
  },
})

test('parse: self recursion', () => {
  const result = Category.parse({ name: 'root', subcategories: [{ name: 'child', subcategories: [] }] })
  expect(result.name).toBe('root')
})

test('parse: mutual recursion', () => {
  const result = User.parse({
    email: 'a@b.com',
    posts: [{ title: 't', author: { email: 'a@b.com', posts: [] } }],
  })
  expect(result.email).toBe('a@b.com')
})

test('getReferences: self recursion does not stack overflow', () => {
  expect(Category.getReferences()).toEqual([])
})

test('getReferences: mutual recursion does not stack overflow', () => {
  expect(User.getReferences()).toEqual([])
})

test('clone: self recursion does not stack overflow', () => {
  const cloned = Category.clone()
  expect(cloned).toBeTruthy()
})

test('clone: mutual recursion does not stack overflow', () => {
  const cloned = User.clone()
  expect(cloned).toBeTruthy()
})

test('dereference: self recursion does not stack overflow', () => {
  const deref = Category.dereference({})
  expect(deref).toBeTruthy()
})

test('dereference: mutual recursion does not stack overflow', () => {
  const deref = User.dereference({})
  expect(deref).toBeTruthy()
})

test('isEqual: self recursion does not stack overflow', () => {
  expect(Category.isEqual(Category)).toBe(true)
})

test('isEqual: mutual recursion does not stack overflow', () => {
  expect(User.isEqual(User)).toBe(true)
})

test('toJSONSchema: self recursion does not stack overflow', () => {
  const schema = toJSONSchema(Category)
  expect(schema).toBeTruthy()
})

test('toJSONSchema: mutual recursion does not stack overflow', () => {
  const schema = toJSONSchema(User)
  expect(schema).toBeTruthy()
})

test('toTypescriptType: self recursion does not stack overflow', () => {
  const ts = toTypescriptType(Category)
  expect(ts).toBeTruthy()
})

test('toTypescriptType: mutual recursion does not stack overflow', () => {
  const ts = toTypescriptType(User)
  expect(ts).toBeTruthy()
})

test('toTypescriptSchema: self recursion does not stack overflow', () => {
  const ts = toTypescriptSchema(Category)
  expect(ts).toBeTruthy()
})

test('toTypescriptSchema: mutual recursion does not stack overflow', () => {
  const ts = toTypescriptSchema(User)
  expect(ts).toBeTruthy()
})

// Tracks the type-safety trade-off from RECURSIVE_SCHEMAS.md. Uses the isolated fixture at
// fixtures/non-schema-shape-value.fixture.ts (kept free of Category/User's own circular-inference
// errors, which were found to cascade and mask unrelated diagnostics when checked in the same file)
// as the single source of truth for both the runtime and compile-time sides of this behavior.
test('shape validation (before the loosening): a non-schema value is only caught once .parse() runs, not at construction', () => {
  expect(() => Bad.parse({ name: 'x', age: 42 })).toThrow('keyValidator._parse is not a function')
})

// Regression guard: passes today because ZodRawShape's strict `IZodType` constraint still rejects a
// non-schema shape value at compile time. If ZodRawShape is ever loosened (e.g. to Record<string, any>,
// to support annotation-free getter recursion — see RECURSIVE_SCHEMAS.md) without an equivalent
// replacement check, tsc will stop reporting this diagnostic and this test will start FAILING — that's
// the signal that the guardrail was removed and needs to be replaced by whatever mechanism takes over
// (a construction-time runtime check, etc.), not silently dropped.
test('shape validation: a non-schema value is a compile-time error (breaks if the shape constraint is loosened)', () => {
  const tscBin = require.resolve('typescript/bin/tsc')
  const fixture = path.join(__dirname, 'fixtures', 'non-schema-shape-value.fixture.ts')
  let output = ''
  try {
    execFileSync(
      process.execPath,
      [tscBin, '--noEmit', fixture, '--module', 'ESNext', '--moduleResolution', 'Node', '--target', 'ES2017', '--strict', '--skipLibCheck', '--esModuleInterop', '--lib', 'dom,ESNext,dom.iterable'],
      { encoding: 'utf-8', stdio: 'pipe' }
    )
  } catch (e) {
    output = String((e as { stdout?: string }).stdout ?? '')
  }

  // (7,3) is the `age: 42,` line/column in the fixture; TS2322 is "not assignable to" — the diagnostic
  // that fires when a shape value isn't a real schema.
  expect(output).toMatch(/non-schema-shape-value\.fixture\.ts\(7,3\)/)
  expect(output).toMatch(/TS2322/)
})
