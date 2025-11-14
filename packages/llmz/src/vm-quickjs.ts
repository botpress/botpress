/**
 * QuickJS-based VM implementation - Phase 1 POC
 *
 * This is a proof-of-concept implementation to validate quickjs-emscripten
 * can replace isolated-vm and Node.js VM for LLMz code execution.
 */

import { isFunction, mapValues, maxBy } from 'lodash-es'
import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten'
import { SourceMapConsumer } from 'source-map-js'

import { compile, type CompiledCode, Identifiers } from './compiler/index.js'
import { CodeExecutionError, InvalidCodeError, Signals, SnapshotSignal, VMSignal } from './errors.js'
import { createJsxComponent, type JsxComponent } from './jsx.js'
import { cleanStackTrace } from './stack-traces.js'
import { type Trace, type Traces, type VMExecutionResult } from './types.js'

const MAX_VM_EXECUTION_TIME = 60_000

// These are the identifiers that we want to exclude from the variable tracking system
const NO_TRACKING = [
  Identifiers.CommentFnIdentifier,
  Identifiers.ToolCallTrackerFnIdentifier,
  Identifiers.ToolTrackerRetIdentifier,
  Identifiers.VariableTrackingFnIdentifier,
  Identifiers.JSXFnIdentifier,
  Identifiers.ConsoleObjIdentifier,
] as const

function getCompiledCode(code: string, traces: Trace[] = []): CompiledCode {
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
}

/**
 * Run async function using QuickJS-Emscripten
 */
export async function runAsyncFunctionQuickJS(
  context: any,
  code: string,
  traces: Trace[] = [],
  _signal: AbortSignal | null = null,
  timeout: number = MAX_VM_EXECUTION_TIME
): Promise<VMExecutionResult> {
  const transformed = getCompiledCode(code, traces)
  const lines_executed = new Map<number, number>()
  const variables: { [k: string]: any } = {}

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

  // Remove variables that will be tracked
  for (const name of Array.from(transformed.variables)) {
    delete context[name]
  }

  // Setup tracking functions
  context[Identifiers.CommentFnIdentifier] = (comment: string, line: number) =>
    traces.push({ type: 'comment', comment, line, started_at: Date.now() })

  context[Identifiers.LineTrackingFnIdentifier] = (line: number) => {
    lines_executed.set(line, (lines_executed.get(line) ?? 0) + 1)
  }

  context[Identifiers.JSXFnIdentifier] = (tool: any, props: any, ...children: any[]) =>
    createJsxComponent({
      type: tool,
      props,
      children,
    })

  context[Identifiers.VariableTrackingFnIdentifier] = (name: string, getter: () => any) => {
    if (NO_TRACKING.includes(name)) {
      return
    }
    variables[name] = () => {
      try {
        const value = getter()
        if (typeof value === 'function') {
          return '[[non-primitive]]'
        }
        return value
      } catch {
        return '[[non-primitive]]'
      }
    }
  }

  let currentToolCall: SnapshotSignal['toolCall'] | undefined
  context[Identifiers.ToolCallTrackerFnIdentifier] = (callId: number, type: 'start' | 'end', outputOrError?: any) => {
    const temp = Signals.maybeDeserializeError(outputOrError?.message)
    if (type === 'end' && temp instanceof SnapshotSignal && temp?.toolCall) {
      currentToolCall = {
        ...temp.toolCall,
        assignment: transformed.toolCalls.get(callId)?.assignment,
      }
    }
  }

  context[Identifiers.ConsoleObjIdentifier] = {
    log: (...args: any[]) => {
      const message = args.shift()
      traces.push({ type: 'log', message, args, started_at: Date.now() })
    },
  }

  context[Identifiers.AsyncIterYieldFnIdentifier] = async function (value: JsxComponent) {
    const startedAt = Date.now()
    try {
      if (typeof value.type !== 'string' || value.type.trim().length === 0) {
        throw new Error('A yield statement must yield a valid tool')
      }

      const toolName = Object.keys(context).find((x) => x.toUpperCase() === value.type.toUpperCase())

      if (!toolName) {
        throw new Error(`Yield tool "${value.type}", but tool is not found`)
      }

      await context[toolName](value)
    } finally {
      traces.push({ type: 'yield', value, started_at: startedAt, ended_at: Date.now() })
    }
  }

  // Initialize QuickJS
  const QuickJS = await getQuickJS()
  const runtime = QuickJS.newRuntime()

  // Set memory limit (128MB like isolated-vm)
  runtime.setMemoryLimit(128 * 1024 * 1024)

  // Set interrupt handler for timeout
  const startTime = Date.now()
  runtime.setInterruptHandler(shouldInterruptAfterDeadline(startTime + timeout))

  const vm = runtime.newContext()

  // Track which properties need to be copied back
  const trackedProperties = new Set<string>()
  const referenceProperties = new Set<string>()

  // Helper to convert JS value to QuickJS handle
  const toVmValue = (value: any): any => {
    if (typeof value === 'string') {
      return vm.newString(value)
    } else if (typeof value === 'number') {
      return vm.newNumber(value)
    } else if (typeof value === 'boolean') {
      return value ? vm.true : vm.false
    } else if (value === null) {
      return vm.null
    } else if (value === undefined) {
      return vm.undefined
    } else if (Array.isArray(value)) {
      const arr = vm.newArray()
      for (let i = 0; i < value.length; i++) {
        const itemHandle = toVmValue(value[i])
        vm.setProp(arr, i, itemHandle)
        if (
          itemHandle !== vm.true &&
          itemHandle !== vm.false &&
          itemHandle !== vm.null &&
          itemHandle !== vm.undefined
        ) {
          itemHandle.dispose()
        }
      }
      return arr
    } else if (typeof value === 'object') {
      const obj = vm.newObject()
      for (const [k, v] of Object.entries(value)) {
        if (typeof v !== 'function') {
          const propHandle = toVmValue(v)
          vm.setProp(obj, k, propHandle)
          if (
            propHandle !== vm.true &&
            propHandle !== vm.false &&
            propHandle !== vm.null &&
            propHandle !== vm.undefined
          ) {
            propHandle.dispose()
          }
        }
      }
      return obj
    }
    return vm.undefined
  }

  // Helper to bridge functions - sync only for now to avoid memory leaks
  // Async functions will run but return undefined immediately (side effects still happen)
  const bridgeFunction = (fn: Function) => {
    return (...argHandles: any[]) => {
      const args = argHandles.map((h: any) => vm.dump(h))
      try {
        const result = fn(...args)
        // Check if it's a promise - ignore async for now
        if (result && typeof result.then === 'function') {
          // Let the promise run in background but return undefined
          // This allows side effects (like yield calls) to work
          result.catch(() => {}) // Prevent unhandled rejection
          return vm.undefined
        }
        // Synchronous result
        return toVmValue(result)
      } catch (err) {
        // Throw error in QuickJS
        const errorMsg = vm.newString(String(err))
        const throwResult = vm.throw(errorMsg)
        errorMsg.dispose()
        return throwResult
      }
    }
  }

  try {
    // Bridge context values to QuickJS
    for (const [key, value] of Object.entries(context)) {
      const descriptor = Object.getOwnPropertyDescriptor(context, key)

      if (descriptor && (descriptor.get || descriptor.set)) {
        // Handle getter/setter properties
        referenceProperties.add(key)

        // Skip getter/setter properties for now - they cause memory leaks in QuickJS
        // Treat them as regular tracked properties instead
        trackedProperties.add(key)
        const initialValue = context[key]
        const valueHandle = toVmValue(initialValue)
        vm.setProp(vm.global, key, valueHandle)
        const shouldDispose =
          valueHandle !== vm.true && valueHandle !== vm.false && valueHandle !== vm.null && valueHandle !== vm.undefined
        if (shouldDispose) {
          valueHandle.dispose()
        }
        continue
      }

      if (typeof value === 'function') {
        // Bridge functions - supports both sync and async
        const fnHandle = vm.newFunction(key, bridgeFunction(value))
        vm.setProp(vm.global, key, fnHandle)
        fnHandle.dispose()
      } else if (typeof value === 'object' && value !== null) {
        trackedProperties.add(key)

        // Bridge objects - handle nested functions and properties
        const objHandle = vm.newObject()
        const props = new Set([...Object.keys(value), ...Object.getOwnPropertyNames(value)])

        for (const prop of props) {
          const propDescriptor = Object.getOwnPropertyDescriptor(value, prop)

          if (propDescriptor && (propDescriptor.get || propDescriptor.set)) {
            // Skip nested getter/setter properties - treat as regular properties
            referenceProperties.add(`${key}.${prop}`)
            const initialValue = (context as any)[key][prop]
            const propHandle = toVmValue(initialValue)
            vm.setProp(objHandle, prop, propHandle)
            const shouldDispose =
              propHandle !== vm.true && propHandle !== vm.false && propHandle !== vm.null && propHandle !== vm.undefined
            if (shouldDispose) {
              propHandle.dispose()
            }
          } else if (typeof (value as any)[prop] === 'function') {
            // Bridge nested functions - supports both sync and async
            const propFnHandle = vm.newFunction(prop, bridgeFunction((value as any)[prop]))
            vm.setProp(objHandle, prop, propFnHandle)
            propFnHandle.dispose()
          } else {
            const propHandle = toVmValue((value as any)[prop])
            vm.setProp(objHandle, prop, propHandle)
            const shouldDispose =
              propHandle !== vm.true && propHandle !== vm.false && propHandle !== vm.null && propHandle !== vm.undefined
            if (shouldDispose) {
              propHandle.dispose()
            }
          }
        }

        vm.setProp(vm.global, key, objHandle)
        objHandle.dispose()

        // Apply object constraints
        if (Object.isSealed(value)) {
          const sealResult = vm.evalCode(`Object.seal(globalThis['${key}']);`)
          if ('error' in sealResult) {
            sealResult.error?.dispose()
          } else {
            sealResult.value.dispose()
          }
        }
        if (!Object.isExtensible(value)) {
          const preventResult = vm.evalCode(`Object.preventExtensions(globalThis['${key}']);`)
          if ('error' in preventResult) {
            preventResult.error?.dispose()
          } else {
            preventResult.value.dispose()
          }
        }
      } else {
        // Bridge primitives
        trackedProperties.add(key)
        const valueHandle = toVmValue(value)
        vm.setProp(vm.global, key, valueHandle)
        const shouldDispose =
          valueHandle !== vm.true && valueHandle !== vm.false && valueHandle !== vm.null && valueHandle !== vm.undefined
        if (shouldDispose) {
          valueHandle.dispose()
        }
      }
    }

    // Setup variable tracking bridge
    const varTrackFnHandle = vm.newFunction(Identifiers.VariableTrackingFnIdentifier, (nameHandle, getterHandle) => {
      const name = vm.getString(nameHandle)

      if (NO_TRACKING.includes(name)) {
        return
      }

      // Try to get the value
      try {
        const valueResult = vm.callFunction(getterHandle, vm.undefined)
        if ('error' in valueResult) {
          variables[name] = '[[non-primitive]]'
          valueResult.error?.dispose()
          return
        }
        const value = vm.dump(valueResult.value)
        valueResult.value.dispose()

        if (typeof value === 'function') {
          variables[name] = '[[non-primitive]]'
        } else {
          variables[name] = value
        }
      } catch {
        variables[name] = '[[non-primitive]]'
      }
    })
    vm.setProp(vm.global, Identifiers.VariableTrackingFnIdentifier, varTrackFnHandle)
    varTrackFnHandle.dispose()

    // Wrap code in async generator - QuickJS pattern with global variables
    // This avoids promise resolution issues by storing results in globalThis
    const scriptCode = `
"use strict";
globalThis.__llmz_result = undefined;
globalThis.__llmz_result_set = false;
globalThis.__llmz_error = null;
globalThis.__llmz_yields = [];

(async () => {
  try {
    async function* __fn__() {
${transformed.code}
    }

    const fn = __fn__();
    let iteration = 0;
    const maxIterations = 10000; // Safety limit

    while (iteration < maxIterations) {
      const { value, done } = await fn.next();

      if (done) {
        globalThis.__llmz_result = value;
        globalThis.__llmz_result_set = true;
        break;
      }

      // Store yielded value
      globalThis.__llmz_yields.push(value);

      // Call yield handler
      await ${Identifiers.AsyncIterYieldFnIdentifier}(value);

      iteration++;
    }

    if (iteration >= maxIterations) {
      throw new Error('Maximum iterations exceeded');
    }
  } catch (err) {
    // Store just the error message to avoid serialization issues
    globalThis.__llmz_error = {
      message: String(err.message || ''),
      stack: String(err.stack || ''),
      name: String(err.name || 'Error')
    };
  }
})();
`.trim()

    // Helper to copy context back from VM - uses vm.dump which handles deep cloning
    const copyBackContextFromVM = () => {
      for (const key of trackedProperties) {
        if (referenceProperties.has(key)) {
          // Skip reference properties (getters/setters) - they update in real-time
          continue
        }

        try {
          // Get the entire value from VM (vm.dump handles deep cloning)
          const valueResult = vm.evalCode(`globalThis['${key}']`)
          if ('error' in valueResult) {
            valueResult.error?.dispose()
            continue
          }
          const vmValue = vm.dump(valueResult.value)
          valueResult.value.dispose()

          // Update the context with the cloned value
          try {
            context[key] = vmValue
          } catch (err) {
            // Ignore read-only property errors
          }
        } catch (err) {
          // Ignore errors when copying back
        }
      }
    }

    // Execute code - result is undefined (async IIFE returns nothing)
    const execResult = vm.evalCode(scriptCode, '<quickjs>')
    if ('error' in execResult) {
      if (execResult.error) {
        const err = vm.dump(execResult.error)
        execResult.error.dispose()
        throw new Error(err?.message || 'Execution failed')
      }
      throw new Error('Execution failed')
    }
    execResult.value.dispose()

    // CRITICAL: Execute pending microtasks (QuickJS doesn't have automatic event loop)
    // This processes all promise .then() callbacks, including the async IIFE
    const maxJobs = 10000
    let jobsExecuted = 0
    while (jobsExecuted < maxJobs) {
      const pending = (runtime as any).executePendingJobs?.(-1)
      if (pending === undefined || pending <= 0) break
      jobsExecuted++
    }

    // Check for errors first
    const errorResult = vm.evalCode('globalThis.__llmz_error')
    if ('error' in errorResult) {
      if (errorResult.error) {
        const err = vm.dump(errorResult.error)
        errorResult.error.dispose()
        throw new Error(err?.message || 'Error check failed')
      }
      throw new Error('Error check failed')
    }
    const errorValue = vm.dump(errorResult.value)
    errorResult.value.dispose()

    if (errorValue !== null && typeof errorValue === 'object') {
      // Copy back context even on error
      copyBackContextFromVM()
      throw new Error(errorValue.message || 'Unknown error')
    }

    // Copy context back from VM before reading result
    copyBackContextFromVM()

    // Get result value from global
    const resultSetResult = vm.evalCode('globalThis.__llmz_result_set')
    if ('error' in resultSetResult) {
      if (resultSetResult.error) {
        resultSetResult.error.dispose()
      }
      throw new Error('Failed to read result set flag')
    }
    const resultSet = vm.dump(resultSetResult.value)
    resultSetResult.value.dispose()

    let returnValue: any = undefined
    if (resultSet) {
      const resultResult = vm.evalCode('globalThis.__llmz_result')
      if ('error' in resultResult) {
        if (resultResult.error) {
          const err = vm.dump(resultResult.error)
          resultResult.error.dispose()
          throw new Error(err?.message || 'Result read failed')
        }
        throw new Error('Result read failed')
      }
      returnValue = vm.dump(resultResult.value)
      resultResult.value.dispose()
    }

    // Deserialize any signals
    returnValue = Signals.maybeDeserializeError(returnValue)

    return {
      success: true,
      variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
      signal: returnValue instanceof VMSignal ? returnValue : undefined,
      lines_executed: Array.from(lines_executed),
      return_value: returnValue,
    } satisfies VMExecutionResult
  } catch (err: any) {
    return handleError(err, code, consumer, traces, variables, lines_executed, currentToolCall)
  } finally {
    vm.dispose()
    runtime.dispose()
  }
}

const handleError = (
  err: Error,
  code: string,
  consumer: SourceMapConsumer,
  traces: Traces.Trace[],
  variables: { [k: string]: any },
  lines_executed: Map<number, number>,
  currentToolCall?: SnapshotSignal['toolCall'] | undefined
): VMExecutionResult => {
  err = Signals.maybeDeserializeError(err)
  const lines = code.split('\n')
  const stackTrace = err.stack || ''
  const LINE_OFFSET = 1

  // Parse QuickJS stack traces: "at <eval> (...)"
  const regex = /<eval>:(\d+):(\d+)/g

  const matches = Array.from(stackTrace.matchAll(regex)).map((x) => {
    const originalLine = consumer.originalPositionFor({
      line: Number(x[1]),
      column: Number(x[2]),
    })
    const line = originalLine.line ?? Number(x[1])
    const actualLine = lines[line - LINE_OFFSET] ?? ''
    const whiteSpacesCount = actualLine.length - actualLine.trimStart().length
    const minColumn = Math.max(whiteSpacesCount, originalLine.column)

    return {
      line,
      column: Math.min(minColumn, Number(x[2])),
    }
  })

  const lastLine = maxBy(matches, (x) => x.line ?? 0)?.line ?? 0

  let debugUserCode = ''
  let truncatedCode = ''
  let truncated = false
  const appendCode = (line: string) => {
    debugUserCode += line
    if (!truncated) {
      truncatedCode += line
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const VM_OFFSET = 2
    const DISPLAY_OFFSET = 0
    const line = lines[i]
    const correctedStackLineIndex = i + LINE_OFFSET + VM_OFFSET
    const match = matches.find((x) => x.line + VM_OFFSET === correctedStackLineIndex)
    const paddedLineNumber = String(correctedStackLineIndex - VM_OFFSET - DISPLAY_OFFSET).padStart(3, '0')

    if (match) {
      appendCode(`> ${paddedLineNumber} | ${line}\n`)
      appendCode(`    ${' '.repeat(paddedLineNumber.length + match.column)}^^^^^^^^^^\n`)
      if (match.line >= lastLine) {
        truncated = true
      }
    } else {
      appendCode(`  ${paddedLineNumber} | ${line}\n`)
    }
  }

  debugUserCode = cleanStackTrace(debugUserCode).trim()
  truncatedCode = cleanStackTrace(truncatedCode).trim()

  if (err instanceof VMSignal) {
    // Add properties to VMSignal (these properties exist on the error in the original vm.ts)
    const signalError = err as VMSignal & {
      stack: string
      truncatedCode: string
      variables: any
      toolCall?: SnapshotSignal['toolCall']
    }
    signalError.stack = debugUserCode
    signalError.truncatedCode = truncatedCode
    signalError.variables = mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter))
    signalError.toolCall = currentToolCall

    return {
      success: true,
      variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
      signal: err,
      lines_executed: Array.from(lines_executed),
    }
  } else {
    traces.push({
      type: 'code_execution_exception',
      position: [matches[0]?.line ?? 0, matches[0]?.column ?? 0],
      message: err.message,
      stackTrace: debugUserCode,
      started_at: Date.now(),
    })

    // Create error and deserialize to get proper message format
    const codeError = new CodeExecutionError(err.message, code, debugUserCode)
    const deserializedError = Signals.maybeDeserializeError(codeError)

    return {
      success: false,
      variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
      error: deserializedError,
      traces,
      lines_executed: Array.from(lines_executed),
    }
  }
}
