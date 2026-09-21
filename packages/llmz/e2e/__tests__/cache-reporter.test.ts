import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Vitest } from 'vitest/node'
import type { Reporter } from 'vitest/reporters'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CacheReporter from './cache-reporter.js'
import { CACHE_USAGE_ENV, markCacheUsed } from './cache-usage.js'

type Files = Parameters<NonNullable<Reporter['onFinished']>>[0]
let directory: string
let cache: string
let ctx: Vitest
let cancel: () => void
let reporter: CacheReporter
const entry = { key: 'used' }
const initial = JSON.stringify(entry) + '\n{"key":"unused"}\n'
const files = (state = 'pass'): Files =>
  [
    {
      filepath: '/suite.test.ts',
      mode: 'run',
      result: { state },
      tasks: [{ type: 'test', mode: 'run', result: { state, startTime: 1 } }],
    },
  ] as Files

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(tmpdir(), 'cache-reporter-test-'))
  cache = path.join(directory, 'cache.jsonl')
  fs.writeFileSync(cache, initial)
  vi.stubEnv('LLMZ_E2E_CACHE_PATH', cache)
  vi.stubEnv('LLMZ_EVAL_MODELS', undefined)
  vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'vitest', 'run'])
  ctx = {
    config: { root: directory },
    logger: { log: vi.fn() },
    onCancel: (fn: () => void) => {
      cancel = fn
    },
    globTestSpecs: async () => [[{}, '/suite.test.ts']],
  } as unknown as Vitest
  reporter = new CacheReporter()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  fs.rmSync(directory, { recursive: true, force: true })
})
function start() {
  reporter.onInit(ctx)
  vi.stubEnv(CACHE_USAGE_ENV, ctx.config.env[CACHE_USAGE_ENV])
  markCacheUsed(cache, entry)
}

describe('E2E cache lifecycle', () => {
  it.each(['pass', 'fail'])('prunes after all tests finish with state %s', async (state) => {
    start()
    await reporter.onFinished(files(state), [])
    expect(fs.readFileSync(cache, 'utf8')).toBe(JSON.stringify(entry) + '\n')
    expect(ctx.config.env?.[CACHE_USAGE_ENV]).toBeUndefined()
  })

  it.each(['filename', 'exclude', 'name', 'watch', 'shard', 'changed', 'related', 'bail', 'models'])(
    'does not track or prune a run restricted by %s',
    async (restriction) => {
      if (restriction === 'filename')
        vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'vitest', 'run', 'single-tool'])
      if (restriction === 'exclude')
        vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'vitest', 'run', '--exclude', '**/one.test.ts'])
      if (restriction === 'name') ctx.config.testNamePattern = /worker/
      if (restriction === 'watch') ctx.config.watch = true
      if (restriction === 'shard') ctx.config.shard = { index: 1, count: 2 }
      if (restriction === 'changed') ctx.config.changed = true
      if (restriction === 'related') ctx.config.related = ['src/tool.ts']
      if (restriction === 'bail') ctx.config.bail = 1
      if (restriction === 'models') vi.stubEnv('LLMZ_EVAL_MODELS', 'one-model')
      reporter.onInit(ctx)
      expect(ctx.config.env?.[CACHE_USAGE_ENV]).toBeUndefined()
      await reporter.onFinished(files(), [])
      expect(fs.readFileSync(cache, 'utf8')).toBe(initial)
    }
  )

  it.each(['cancelled', 'missing file', 'skipped', 'only', 'unfinished', 'hook failure', 'unhandled error'])(
    'keeps the cache for %s',
    async (reason) => {
      start()
      const result = files()
      if (reason === 'cancelled') cancel()
      if (reason === 'missing file') result.length = 0
      if (reason === 'skipped') result[0]!.tasks[0]!.mode = 'skip'
      if (reason === 'only') result[0]!.tasks[0]!.mode = 'only'
      if (reason === 'unfinished') result[0]!.tasks[0]!.result = undefined
      if (reason === 'hook failure') result[0]!.result!.hooks = { beforeAll: 'fail' }
      await reporter.onFinished(result, reason === 'unhandled error' ? [new Error('worker died')] : [])
      expect(fs.readFileSync(cache, 'utf8')).toBe(initial)
    }
  )
})
