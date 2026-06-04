import { isFunction, mapValues } from 'lodash-es'

import { Identifiers } from '../../compiler/index.js'
import { Signals, VMSignal } from '../../errors.js'
import type { JsxComponent } from '../../jsx.js'
import type { VMExecutionResult } from '../../types.js'
import { handleCatch, handleErrorNode } from '../errors.js'
import { instrumentContext, NO_TRACKING } from '../instrument.js'
import type { DriverExecutionContext, VMDriver } from '../types.js'

// Unsandboxed execution via Node's AsyncGeneratorFunction constructor.
// No isolation — shares the same heap. Used as fallback when QuickJS WASM can't load.
export class NodeDriver implements VMDriver {
  public async execute(ctx: DriverExecutionContext): Promise<VMExecutionResult> {
    const { transformed, consumer, context, traces, code, lines_executed, variables } = ctx

    const state = instrumentContext(context, transformed, traces, variables, lines_executed, consumer, 0)

    // No built-in AsyncGeneratorFunction type in TS — extract the constructor at runtime
    type AsyncGeneratorCtor = (...args: unknown[]) => (...args: unknown[]) => AsyncGenerator<JsxComponent>
    const AsyncFunction: AsyncGeneratorCtor = async function* () {}.constructor as AsyncGeneratorCtor

    return await (async () => {
      const descriptors = Object.getOwnPropertyDescriptors(context)

      const topLevelProperties = Object.keys(descriptors).filter(
        (x) =>
          !NO_TRACKING.includes(x) &&
          descriptors[x] &&
          typeof descriptors[x].value !== 'function' &&
          typeof descriptors[x].value !== 'object'
      )

      const __report = (name: string, value: unknown) => {
        if (context[name] !== undefined && context[name] !== value) {
          context[name] = value
        }
      }

      context.__report = __report

      // Inject __report calls into the line tracker so primitive context values sync back on every line
      const reportAll = topLevelProperties.map((x) => `__report("${x}", ${x})`).join(';')

      const assigner = `let __${Identifiers.LineTrackingFnIdentifier} = ${Identifiers.LineTrackingFnIdentifier}; ${Identifiers.LineTrackingFnIdentifier} = function(line) { ${reportAll}; __${Identifiers.LineTrackingFnIdentifier}(line);}`
      const wrapper = `"use strict"; try { ${assigner};${transformed.code} } finally { ${reportAll} };`

      const fn = AsyncFunction(...Object.keys(context), wrapper)
      const res = fn(...Object.values(context))

      do {
        const { value, done } = await res.next()
        if (done) {
          return value
        }
        await context[Identifiers.AsyncIterYieldFnIdentifier](value)
        // oxlint-disable-next-line no-constant-condition
      } while (true)
    })()
      .then((res) => {
        res = Signals.maybeDeserializeError(res)
        return {
          success: true,
          variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
          signal: res instanceof VMSignal ? res : undefined,
          lines_executed: Array.from(lines_executed),
          return_value: res,
        } satisfies VMExecutionResult
      })
      .catch((err) => handleErrorNode(err, code, consumer, traces, variables, lines_executed, state.currentToolCall))
      .catch((err) => handleCatch(err, traces, variables, lines_executed))
  }
}
