import { SourceMapConsumer } from 'source-map-js'

import { compile } from '../compiler/index.js'
import { InvalidCodeError } from '../errors.js'
import { getQuickJSVariant, type QuickJSSyncVariantEx } from '../quickjs-variant.js'
import type { Trace, VMExecutionResult } from '../types.js'
import { NodeDriver } from './drivers/node.js'
import { loadQuickJSModule, QuickJSDriver } from './drivers/quickjs.js'
import type { VMContext, VMDriver } from './types.js'

const MAX_VM_EXECUTION_TIME = 60_000

const useQuickJS = () => typeof process === 'undefined' || process?.env?.USE_QUICKJS !== 'false'

// The Node driver runs code through AsyncFunction(...), which workerd bans
// ("Code generation from strings disallowed") — falling back to it would only
// mask the real QuickJS load failure behind a confusing EvalError.
const isWorkerd = () => typeof navigator !== 'undefined' && navigator?.userAgent === 'Cloudflare-Workers'

/**
 * Pre-warms the VM so the first execution doesn't pay the QuickJS WASM
 * instantiation cost. Fire-and-forget: called as soon as the model starts
 * writing a `■run` block, so the module loads while the code is still being
 * generated. No-op when the QuickJS driver is disabled or already loaded.
 */
export const warmupVM = (): void => {
  if (useQuickJS()) {
    loadQuickJSModule().catch(() => {
      // Best-effort: a load failure here will surface (and fall back to the
      // Node driver) on the actual execution path.
    })
  }
}

export async function runAsyncFunction(
  context: VMContext,
  code: string,
  traces: Trace[] = [],
  signal: AbortSignal | null = null,
  timeout: number = MAX_VM_EXECUTION_TIME
): Promise<VMExecutionResult> {
  const transformed = (() => {
    try {
      return compile(code)
    } catch (err: any) {
      traces.push({
        type: 'invalid_code_exception',
        message: err?.message ?? 'Unknown error',
        code,
        started_at: Date.now(),
      })
      throw new InvalidCodeError(err.message, code)
    }
  })()

  const lines_executed = new Map<number, number>()
  const variables: Record<string, any> = {}

  const consumer = new SourceMapConsumer({
    version: transformed.map.version.toString(),
    mappings: transformed.map.mappings,
    names: transformed.map.names,
    sources: transformed.map.sources,
    sourcesContent: [transformed.code],
    file: transformed.map.file!,
  })

  context ??= {}

  // Remove variables that the compiler will track — avoids stale values in the context
  for (const name of Array.from(transformed.variables)) {
    delete context[name]
  }

  let driver: VMDriver

  if (useQuickJS()) {
    try {
      driver = new QuickJSDriver()
      return await driver.execute({
        transformed,
        consumer,
        context,
        traces,
        signal,
        timeout,
        code,
        lines_executed,
        variables,
        currentToolCall: undefined,
      })
    } catch (quickjsError: any) {
      const variant = getQuickJSVariant() as QuickJSSyncVariantEx
      const debugInfo = {
        error: quickjsError?.message || String(quickjsError),
        errorStack: quickjsError?.stack,
        wasmSource: variant._wasmSource,
        wasmLoadedSuccessfully: variant._wasmLoadedSuccessfully,
        wasmSize: variant._wasmSize,
        wasmLoadError: variant._wasmLoadError,
        nodeVersion: typeof process !== 'undefined' && process.version ? process.version : 'undefined',
        platform: typeof process !== 'undefined' && process.platform ? process.platform : 'undefined',
      }

      if (isWorkerd()) {
        // No fallback possible on workerd — surface the actual QuickJS failure
        console.error('QuickJS failed to load and the node driver is unavailable on Cloudflare Workers.')
        console.error('Debug info:', JSON.stringify(debugInfo, null, 2))
        if (quickjsError instanceof Error) {
          ;(quickjsError as any).debugInfo = debugInfo
          throw quickjsError
        }
        throw new Error(`QuickJS failed to load on Cloudflare Workers: ${debugInfo.error}`)
      }

      // QuickJS WASM failed to load — fall back to unsandboxed Node driver
      console.warn('QuickJS failed to load, falling back to node driver.')
      console.warn('Error:', quickjsError?.message || quickjsError)
      console.warn('Debug info:', JSON.stringify(debugInfo, null, 2))
    }
  }

  driver = new NodeDriver()
  return await driver.execute({
    transformed,
    consumer,
    context,
    traces,
    signal,
    timeout,
    code,
    lines_executed,
    variables,
    currentToolCall: undefined,
  })
}
