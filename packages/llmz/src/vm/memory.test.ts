import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Session } from '../session.js'
import { runAsyncFunction } from './index.js'
import { NodeDriver } from './drivers/node.js'
import { QuickJSDriver } from './drivers/quickjs.js'
for (const driver of ['true', 'false']) {
  describe(`memory capture (QuickJS=${driver})`, () => {
    let previous: string | undefined
    beforeEach(() => {
      previous = process.env.USE_QUICKJS
      process.env.USE_QUICKJS = driver
    })
    afterEach(() => {
      if (previous === undefined) {
        delete process.env.USE_QUICKJS
      } else {
        process.env.USE_QUICKJS = previous
      }
    })

    it('captures same-value assignments and postfix values without reporting reinjection as writes', async () => {
      const result = await runAsyncFunction(
        {
          count: 1,
          untouched: 42,
        },
        'count = 1; const old = count++; return old'
      )
      expect(result.success).toBe(true)
      expect(result.variables).toEqual({
        count: 2,
        untouched: 42,
        old: 1,
      })
      expect(result.variableWrites?.filter((write) => write.name === 'count')).toHaveLength(2)
      expect(result.variableWrites?.some((write) => write.name === 'untouched')).toBe(false)
    })

    it('does not count short-circuited logical assignments as writes', async () => {
      const result = await runAsyncFunction(
        {
          keep: 1,
          change: 0,
        },
        'keep ||= 2; change ||= 0; return { keep, change }'
      )
      expect(result.success).toBe(true)
      expect(result.variableWrites?.map((write) => write.name)).toEqual(['change'])
      expect(result.variables).toEqual({
        keep: 1,
        change: 0,
      })
    })

    it('captures final mutations through aliases and methods, including an executed prefix before failure', async () => {
      const result = await runAsyncFunction(
        {
          account: {
            age: 1,
          },
          rows: [1],
        },
        'const alias = account; alias.age = 2; rows.push(2); throw new Error("stop")'
      )
      expect(result.success).toBe(false)
      expect(result.variables).toEqual({
        account: {
          age: 2,
        },
        rows: [1, 2],
        alias: {
          age: 2,
        },
      })
    })

    it('retains initialized declarators but reports a failed redeclaration unavailable', async () => {
      const result = await runAsyncFunction(
        {
          account: 'old',
        },
        'const ok = 1, account = await fail(); return ok',
        [],
        null,
        1000,
        ['account']
      )
      // Missing fail is deliberately an execution error after the first declarator.
      expect(result.success).toBe(false)
      expect(result.variables.ok).toBe(1)
      expect(result.variables).not.toHaveProperty('account')
      expect(result.captureErrors?.some((error) => error.name === 'account')).toBe(true)
      expect(result.variableWrites?.some((write) => write.name === 'account')).toBe(false)
    })

    it('does not leak function parameters or block-local shadows', async () => {
      const result = await runAsyncFunction(
        {
          account: 1,
        },
        'function change(account) { account = 2; let secret = 3; } change(4); { let account = 9; account++; } return account'
      )
      expect(result.success).toBe(true)
      expect(result.variables).toEqual({
        account: 1,
      })
      expect(result.variableWrites).toEqual([])
    })

    it('preserves undefined object properties and rejects lossy unsupported results', async () => {
      const exact = await runAsyncFunction({}, 'const data = { x: undefined, rows: [undefined] }; return data')
      expect(exact.success && exact.return_value).toEqual({
        x: undefined,
        rows: [undefined],
      })
      const unsupported = await runAsyncFunction({}, 'const bad = new Date(); return bad')
      expect(unsupported.success).toBe(true)
      expect(unsupported.variables).not.toHaveProperty('bad')
      expect(unsupported.captureErrors?.map((error) => error.name)).toEqual(expect.arrayContaining(['bad', '$return']))
    })

    it('preserves deeply frozen snapshots returned by host property getters', async () => {
      const profile = Object.freeze({
        nested: Object.freeze({ age: 40 }),
        rows: Object.freeze([Object.freeze({ id: 1 })]),
      })
      const account = Object.defineProperty({}, 'profile', {
        enumerable: true,
        get: () => profile,
      })
      const result = await runAsyncFunction(
        { account },
        `
        const profile = account.profile;
        try { profile.nested.age = -1; } catch {}
        try { profile.rows[0].id = 2; } catch {}
        try { profile.rows.push({ id: 3 }); } catch {}
        return { age: profile.nested.age, id: profile.rows[0].id, count: profile.rows.length };
      `
      )
      expect(result.success && result.return_value).toEqual({
        age: 40,
        id: 1,
        count: 1,
      })
    })

    it('preserves undefined fields and array values across host property setters', async () => {
      const written: unknown[] = []
      const account = Object.defineProperty({}, 'profile', {
        enumerable: true,
        get: () => Object.freeze({ age: 40 }),
        set: (value) => written.push(value),
      })
      const result = await runAsyncFunction(
        { account },
        `
        account.profile = { age: 41, detail: undefined, entries: [undefined] };
        return true;
      `
      )
      expect(result.success).toBe(true)
      expect(written).toEqual([
        {
          age: 41,
          detail: undefined,
          entries: [undefined],
        },
      ])
    })

    it('protects deeply nested historical values and allows explicit copies', async () => {
      const session = new Session()
      const iteration = session.nextIteration('one')
      session.commitIteration({
        id: 'one',
        number: 1,
        turn: 1,
        hasResult: true,
        result: {
          nested: {
            age: 1,
          },
        },
      })
      session.settleIteration(iteration.id, { outcome: 'completed' })
      const blocked = await runAsyncFunction(
        session.getBindings(),
        'const alias = $return.nested; alias.age = 2; return alias'
      )
      expect(blocked.success).toBe(false)
      expect((session.getBindings().$return as any).nested.age).toBe(1)
      const copied = await runAsyncFunction(
        session.getBindings(),
        'const copy = { ...$return.nested }; copy.age = 2; return copy'
      )
      expect(copied.success && copied.return_value).toEqual({
        age: 2,
      })
    })
  })
}

describe('QuickJS failure boundaries', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('does not replay effects in the Node driver after a QuickJS execution exception', async () => {
    vi.stubEnv('USE_QUICKJS', 'true')
    const charge = vi.fn()
    vi.spyOn(QuickJSDriver.prototype, 'execute').mockImplementation(async (context) => {
      context.context.charge()
      throw new Error('Unexpected bridge failure after charging')
    })
    const nodeExecution = vi.spyOn(NodeDriver.prototype, 'execute')
    await expect(runAsyncFunction({ charge }, 'charge();')).rejects.toThrow('Unexpected bridge failure')
    expect(charge).toHaveBeenCalledTimes(1)
    expect(nodeExecution).not.toHaveBeenCalled()
  })

  it('rejects unsupported setter input instead of coercing it into schema-valid data', async () => {
    vi.stubEnv('USE_QUICKJS', 'true')
    const setter = vi.fn()
    const account = Object.defineProperty({}, 'profile', {
      enumerable: true,
      get: () => Object.freeze({ age: 40 }),
      set: setter,
    })
    const result = await runAsyncFunction({ account }, 'account.profile = { age: NaN };')
    expect(result.success).toBe(false)
    expect(setter).not.toHaveBeenCalled()
  })
})
