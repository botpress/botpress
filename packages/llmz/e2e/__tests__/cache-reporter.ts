import path from 'node:path'
import { parseCLI, type Vitest } from 'vitest/node'
import type { Reporter } from 'vitest/reporters'
import { CACHE_USAGE_ENV, CacheUsageRun } from './cache-usage.js'

type Files = Parameters<NonNullable<Reporter['onFinished']>>[0]
type Task = Files[number] | Files[number]['tasks'][number]

/** Skips, .only, unfinished tests, and failed hooks are not a complete traversal. */
export function completed(task: Task): boolean {
  if (task.mode !== 'run' || !['pass', 'fail'].includes(task.result?.state ?? '')) return false
  if (Object.values(task.result?.hooks ?? {}).some((state) => state !== 'pass')) return false
  if ('tasks' in task) return task.tasks.length > 0 && task.tasks.every(completed)
  return task.result?.startTime !== undefined
}

/** Prunes only after an unfiltered, fully traversed E2E run, including assertion failures. */
export default class CacheReporter implements Reporter {
  private _ctx?: Vitest
  private _run?: CacheUsageRun
  private _cancelled = false

  public onInit(ctx: Vitest): void {
    if (this._run) return
    this._ctx = ctx
    const config = ctx.config
    const { filter, options } = parseCLI(['vitest', ...process.argv.slice(2)], { allowUnknownOptions: true })
    if (
      filter.length ||
      options.exclude?.length ||
      config.watch ||
      config.testNamePattern ||
      config.changed ||
      config.related?.length ||
      config.shard ||
      config.bail ||
      config.project?.length ||
      process.env.LLMZ_EVAL_MODELS !== undefined
    ) {
      return
    }

    this._run = new CacheUsageRun(
      process.env.LLMZ_E2E_CACHE_PATH ?? path.join(config.root, 'e2e/__tests__/cache.jsonl')
    )
    config.env ??= {}
    config.env[CACHE_USAGE_ENV] = this._run.journal
    ctx.onCancel(() => {
      this._cancelled = true
    })
  }

  public async onFinished(files: Files, errors: unknown[]): Promise<void> {
    const run = this._run
    if (!run || !this._ctx) return
    try {
      const expected = (await this._ctx.globTestSpecs()).map((spec) => spec[1]).sort()
      const actual = files.map((file) => file.filepath).sort()
      if (
        this._cancelled ||
        this._ctx.isCancelling ||
        errors.length ||
        !files.length ||
        JSON.stringify(expected) !== JSON.stringify(actual) ||
        !files.every(completed)
      ) {
        this._ctx.logger.log('E2E cache: incomplete run; pruning skipped.')
        return
      }
      const result = run.prune()
      this._ctx.logger.log(
        result
          ? `E2E cache: retained ${result.kept} used entries; pruned ${result.removed} unused entries. New recordings preserved.`
          : 'E2E cache: no safe cleanup available; pruning skipped.'
      )
    } finally {
      delete this._ctx.config.env[CACHE_USAGE_ENV]
      run.dispose()
      this._run = undefined
    }
  }
}
