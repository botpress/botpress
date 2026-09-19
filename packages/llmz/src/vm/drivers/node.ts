import { isFunction, mapValues } from 'lodash-es'
import { Identifiers } from '../../compiler/index.js'
import { Signals, VMSignal } from '../../errors.js'
import { RESERVED_RUNTIME_NAMES } from '../../runtime-names.js'
import type { VMExecutionResult } from '../../types.js'
import { handleCatch, handleErrorNode } from '../errors.js'
import { finalizeMemoryCapture, instrumentContext, NO_TRACKING } from '../instrument.js'
import { VM_PROGRAM_COMPLETE, VM_TERMINATION, type DriverExecutionContext, type VMDriver } from '../types.js'
// Unsandboxed execution via Node's AsyncFunction constructor.
// No isolation — shares the same heap. Used as fallback when QuickJS WASM can't load.
export class NodeDriver implements VMDriver {
  public async execute(ctx: DriverExecutionContext): Promise<VMExecutionResult> {
    const { transformed, consumer, context, traces, code, lines_executed, variables } = ctx
    const state = instrumentContext(
      context,
      transformed,
      traces,
      variables,
      lines_executed,
      consumer,
      0,
      ctx.memoryNames
    )
    // No built-in AsyncFunction type in TS — extract the constructor at runtime
    type AsyncFunctionCtor = (...args: unknown[]) => (...args: unknown[]) => Promise<unknown>

    const AsyncFunction: AsyncFunctionCtor = async function () {}.constructor as AsyncFunctionCtor
    const result = await (async () => {
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
      const trackInputs = ctx.memoryNames
        .map(
          (name) =>
            `${Identifiers.VariableTrackingFnIdentifier}(${JSON.stringify(name)}, () => eval(${JSON.stringify(name)}), undefined, "read");`
        )
        .join('')
      const bindings = Object.keys(context)
      const protectedBindings = bindings
        .filter((name) => RESERVED_RUNTIME_NAMES.has(name))
        .map((name) => `const ${name} = __llmz_binding_${bindings.indexOf(name)};`)
        .join('')
      const parameters = bindings.map((name, index) =>
        RESERVED_RUNTIME_NAMES.has(name) ? `__llmz_binding_${index}` : name
      )
      const wrapper = `"use strict"; ${protectedBindings} try { ${assigner};${trackInputs}${transformed.code} } finally { ${reportAll} };`
      const fn = AsyncFunction(...parameters, wrapper)

      try {
        return await fn(...Object.values(context))
      } finally {
        context[VM_PROGRAM_COMPLETE]?.()
      }
    })()
      .then((res) => {
        const signal = context[VM_TERMINATION]?.getSignal?.()

        if (signal) {
          throw signal
        }

        if (context[VM_TERMINATION]?.isTerminated()) {
          res = undefined
        }

        res = Signals.maybeDeserializeError(res)
        return {
          success: true,
          variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
          signal: res instanceof VMSignal ? res : undefined,
          lines_executed: Array.from(lines_executed),
          return_value: res,
        } satisfies VMExecutionResult
      })
      .catch((err) => {
        const signal = context[VM_TERMINATION]?.getSignal?.()

        if (signal) {
          return handleErrorNode(
            signal,
            code,
            consumer,
            traces,
            variables,
            lines_executed,
            state.currentToolCall ?? signal.toolCall
          )
        }

        if (context[VM_TERMINATION]?.isTerminated()) {
          return {
            success: true,
            variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
            lines_executed: Array.from(lines_executed),
          } satisfies VMExecutionResult
        }

        return handleErrorNode(err, code, consumer, traces, variables, lines_executed, state.currentToolCall)
      })
      .catch((err) => handleCatch(err, traces, variables, lines_executed))
    return finalizeMemoryCapture(result, state)
  }
}
