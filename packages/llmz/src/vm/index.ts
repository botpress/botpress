import { SourceMapConsumer } from 'source-map-js'

import { compile } from '../compiler/index.js'
import { InvalidCodeError } from '../errors.js'
import { BundledReleaseSyncVariant } from '../quickjs-variant.js'
import type { Trace, VMExecutionResult } from '../types.js'
import { NodeDriver } from './drivers/node.js'
import { QuickJSDriver } from './drivers/quickjs.js'
import type { VMContext, VMDriver } from './types.js'

const MAX_VM_EXECUTION_TIME = 60_000

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

  // TODO: transformed.map (the result of compile above) needs typing,
  // once that's done, we can remove the null assertions here
  const consumer = new SourceMapConsumer({
    version: transformed.map!.version.toString(),
    mappings: transformed.map!.mappings,
    names: transformed.map!.names!,
    sources: [transformed.map!.file!],
    sourcesContent: [transformed.code!],
    file: transformed.map!.file!,
    sourceRoot: transformed.map!.sourceRoot!,
  })

  context ??= {}

  // Remove variables that the compiler will track — avoids stale values in the context
  for (const name of Array.from(transformed.variables)) {
    delete context[name]
  }

  let driver: VMDriver

  const useQuickJS = typeof process === 'undefined' || process?.env?.USE_QUICKJS !== 'false'

  if (useQuickJS) {
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
      // QuickJS WASM failed to load — fall back to unsandboxed Node driver
      const debugInfo = {
        error: quickjsError?.message || String(quickjsError),
        errorStack: quickjsError?.stack,
        wasmSource: BundledReleaseSyncVariant._wasmSource,
        wasmLoadedSuccessfully: BundledReleaseSyncVariant._wasmLoadedSuccessfully,
        wasmSize: BundledReleaseSyncVariant._wasmSize,
        wasmLoadError: BundledReleaseSyncVariant._wasmLoadError,
        nodeVersion: typeof process !== 'undefined' && process.version ? process.version : 'undefined',
        platform: typeof process !== 'undefined' && process.platform ? process.platform : 'undefined',
      }

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
