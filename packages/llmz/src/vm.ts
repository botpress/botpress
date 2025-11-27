/**
 * LLMz VM Implementation
 *
 * Supports two execution drivers:
 * 1. QuickJS (quickjs-emscripten) - Sandboxed execution with memory limits and timeout
 * 2. Node (native) - Direct execution without sandbox, for environments where QuickJS is not available
 */

/* oxlint-disable max-depth */

import { isFunction, mapValues, maxBy } from 'lodash-es'
import { newQuickJSWASMModuleFromVariant, shouldInterruptAfterDeadline } from 'quickjs-emscripten-core'
import { SourceMapConsumer } from 'source-map-js'

import { compile, CompiledCode, Identifiers } from './compiler/index.js'
import { CodeExecutionError, InvalidCodeError, Signals, SnapshotSignal, VMSignal } from './errors.js'
import { createJsxComponent, JsxComponent } from './jsx.js'
import { BundledReleaseSyncVariant } from './quickjs-variant.js'
import { cleanStackTrace } from './stack-traces.js'
import { Trace, Traces, VMExecutionResult } from './types.js'

const MAX_VM_EXECUTION_TIME = 60_000

type Driver = 'quickjs' | 'node'

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

export async function runAsyncFunction(
  context: any,
  code: string,
  traces: Trace[] = [],
  signal: AbortSignal | null = null,
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

  // Determine which driver to use - try QuickJS first, fallback to node if it fails
  let DRIVER: Driver = 'quickjs'

  // Check if user explicitly disabled QuickJS
  if (typeof process !== 'undefined' && process?.env?.USE_QUICKJS === 'false') {
    DRIVER = 'node'
  }

  // ============================================================================
  // QuickJS Driver
  // ============================================================================
  if (DRIVER === 'quickjs') {
    // Try to load QuickJS - if it fails, fallback to node driver
    try {
      // Setup tracking functions
      context[Identifiers.CommentFnIdentifier] = (comment: string, line: number) => {
        // Filter out internal markers from traces
        if (comment.includes('__LLMZ_USER_CODE_START__') || comment.includes('__LLMZ_USER_CODE_END__')) {
          return
        }
        traces.push({ type: 'comment', comment, line, started_at: Date.now() })
      }

      // Find the actual offset by locating the user code start marker
      // Use codeWithMarkers which still has the markers before postProcessing removes them
      const codeWithMarkers = (transformed as any).codeWithMarkers || transformed.code
      const markerLines = codeWithMarkers.split('\n')
      const USER_CODE_START_MARKER = '/* __LLMZ_USER_CODE_START__ */'
      let userCodeStartLine = -1
      for (let i = 0; i < markerLines.length; i++) {
        if (markerLines[i]?.includes(USER_CODE_START_MARKER)) {
          userCodeStartLine = i + 1 // Line numbers are 1-indexed
          break
        }
      }

      context[Identifiers.LineTrackingFnIdentifier] = (line: number) => {
        // Map the transformed code line back to the original source line
        const originalLine = consumer.originalPositionFor({
          line,
          column: 0,
        })
        const mappedLine = originalLine.line ?? line

        // Calculate offset: the marker line in transformed code corresponds to line 0 of user code
        // So user line = mapped line - marker line
        const userCodeLine = Math.max(1, mappedLine - userCodeStartLine)

        lines_executed.set(userCodeLine, (lines_executed.get(userCodeLine) ?? 0) + 1)
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
      context[Identifiers.ToolCallTrackerFnIdentifier] = (
        callId: number,
        type: 'start' | 'end',
        outputOrError?: any
      ) => {
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

      // Initialize QuickJS using our bundled variant
      // This includes the WASM file directly in llmz's dist/ to avoid path resolution issues
      const QuickJS = await newQuickJSWASMModuleFromVariant(BundledReleaseSyncVariant)
      const runtime = QuickJS.newRuntime()

      // Set memory limit (128MB)
      runtime.setMemoryLimit(128 * 1024 * 1024)

      // Set interrupt handler for timeout and abort signal
      const startTime = Date.now()
      const timeoutHandler = shouldInterruptAfterDeadline(startTime + timeout)

      runtime.setInterruptHandler(() => {
        // Check if execution was aborted
        if (signal?.aborted) {
          return true // Interrupt execution
        }
        // Check if timeout exceeded
        return timeoutHandler(runtime)
      })

      const vm = runtime.newContext()

      // Track which properties need to be copied back
      const trackedProperties = new Set<string>()
      const referenceProperties = new Set<string>()

      // Track all pending promises - we need to resolve them synchronously before disposing VM
      const pendingPromises: Array<{
        hostPromise: Promise<any>
        deferredPromise: any
      }> = []

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
          // Create a proper array with prototype methods using evalCode
          // We build the array literal directly to preserve methods like .map()
          const items = value.map((item) => {
            if (typeof item === 'string') {
              return JSON.stringify(item)
            } else if (typeof item === 'number' || typeof item === 'boolean') {
              return String(item)
            } else if (item === null) {
              return 'null'
            } else if (item === undefined) {
              return 'undefined'
            } else if (typeof item === 'object') {
              return JSON.stringify(item)
            }
            return 'undefined'
          })
          const arrayLiteral = `[${items.join(',')}]`
          const result = vm.evalCode(arrayLiteral)
          if ('error' in result) {
            result.error?.dispose()
            return vm.undefined
          }
          const arrHandle = result.value
          return arrHandle
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

      // Helper to bridge functions - handles both sync and async
      const bridgeFunction = (fn: Function, _fnName: string = 'anonymous') => {
        return (...argHandles: any[]) => {
          const args = argHandles.map((h: any) => vm.dump(h))
          try {
            const result = fn(...args)
            // Check if it's a promise - create a QuickJS deferred promise
            if (result && typeof result.then === 'function') {
              // Create a QuickJS deferred promise
              const promise = vm.newPromise()

              // Track this promise so we can await and resolve it synchronously
              pendingPromises.push({
                hostPromise: result,
                deferredPromise: promise,
              })

              // Schedule executePendingJobs when the promise settles
              void promise.settled.then(() => {
                if (runtime.alive) {
                  runtime.executePendingJobs()
                }
              })

              // Return the promise handle
              return promise.handle
            }
            // Synchronous result
            return toVmValue(result)
          } catch (err) {
            // Serialize the error properly (especially for VMSignal and other special errors)
            // VMSignal and other error classes auto-serialize themselves in their constructor
            // so err.message already contains the JSON-serialized error data
            const serialized = err instanceof Error ? err.message : String(err)

            // Re-throw the error as a plain Error with the serialized message
            // QuickJS-emscripten will catch this and convert it to a QuickJS error
            throw new Error(serialized)
          }
        }
      }

      try {
        // Bridge context values to QuickJS
        for (const [key, value] of Object.entries(context)) {
          const descriptor = Object.getOwnPropertyDescriptor(context, key)

          if (descriptor && (descriptor.get || descriptor.set)) {
            // Handle getter/setter properties on globalThis
            referenceProperties.add(key)
            trackedProperties.add(key)

            // Create getter function if exists
            let getterCode = 'undefined'
            if (descriptor.get) {
              const getterBridge = vm.newFunction(`get_${key}`, () => {
                try {
                  const hostValue = (context as any)[key]
                  return toVmValue(hostValue)
                } catch (err: any) {
                  const serialized = err instanceof Error ? err.message : String(err)
                  throw new Error(serialized)
                }
              })
              const getterName = `__getter_${key}__`
              vm.setProp(vm.global, getterName, getterBridge)
              getterBridge.dispose()
              getterCode = getterName
            }

            // Create setter function if exists
            let setterCode = 'undefined'
            if (descriptor.set) {
              const setterBridge = vm.newFunction(`set_${key}`, (valueHandle: any) => {
                try {
                  const jsValue = vm.dump(valueHandle)
                  ;(context as any)[key] = jsValue
                  return vm.undefined
                } catch (err: any) {
                  const serialized = err instanceof Error ? err.message : String(err)
                  throw new Error(serialized)
                }
              })
              const setterName = `__setter_${key}__`
              vm.setProp(vm.global, setterName, setterBridge)
              setterBridge.dispose()
              setterCode = setterName
            }

            // Use evalCode to define the property with getter/setter on globalThis
            const definePropertyCode = `
          Object.defineProperty(globalThis, '${key}', {
            enumerable: true,
            configurable: ${descriptor.configurable !== false},
            get: ${getterCode},
            set: ${setterCode}
          });
        `
            const result = vm.evalCode(definePropertyCode)
            if ('error' in result) {
              result.error?.dispose()
            } else {
              result.value.dispose()
            }
            continue
          }

          if (typeof value === 'function') {
            // Bridge functions - supports both sync and async
            const fnHandle = vm.newFunction(key, bridgeFunction(value, key))
            vm.setProp(vm.global, key, fnHandle)
            fnHandle.dispose()
          } else if (Array.isArray(value)) {
            // Bridge arrays - use toVmValue which creates proper arrays with methods
            trackedProperties.add(key)
            const arrayHandle = toVmValue(value)
            vm.setProp(vm.global, key, arrayHandle)
            const shouldDispose =
              arrayHandle !== vm.true &&
              arrayHandle !== vm.false &&
              arrayHandle !== vm.null &&
              arrayHandle !== vm.undefined
            if (shouldDispose) {
              arrayHandle.dispose()
            }
          } else if (typeof value === 'object' && value !== null) {
            trackedProperties.add(key)

            // Bridge objects - handle nested functions and properties
            const objHandle = vm.newObject()
            const props = new Set([...Object.keys(value), ...Object.getOwnPropertyNames(value)])
            const getterSetterProps: Array<{
              prop: string
              descriptor: PropertyDescriptor
            }> = []

            for (const prop of props) {
              const propDescriptor = Object.getOwnPropertyDescriptor(value, prop)

              if (propDescriptor && (propDescriptor.get || propDescriptor.set)) {
                // Defer getter/setter setup until after object is on global
                referenceProperties.add(`${key}.${prop}`)
                getterSetterProps.push({ prop, descriptor: propDescriptor })
              } else if (typeof (value as any)[prop] === 'function') {
                // Bridge nested functions - supports both sync and async
                const propFnHandle = vm.newFunction(prop, bridgeFunction((value as any)[prop], `${key}.${prop}`))
                vm.setProp(objHandle, prop, propFnHandle)
                propFnHandle.dispose()
              } else {
                const propHandle = toVmValue((value as any)[prop])
                vm.setProp(objHandle, prop, propHandle)
                const shouldDispose =
                  propHandle !== vm.true &&
                  propHandle !== vm.false &&
                  propHandle !== vm.null &&
                  propHandle !== vm.undefined
                if (shouldDispose) {
                  propHandle.dispose()
                }
              }
            }

            vm.setProp(vm.global, key, objHandle)
            objHandle.dispose()

            // Now set up getter/setter properties (after object is on global)
            for (const { prop, descriptor } of getterSetterProps) {
              // Create getter function if exists
              let getterCode = 'undefined'
              if (descriptor.get) {
                const getterBridge = vm.newFunction(`get_${prop}`, () => {
                  try {
                    const hostValue = (context as any)[key][prop]
                    return toVmValue(hostValue)
                  } catch (err: any) {
                    const serialized = err instanceof Error ? err.message : String(err)
                    throw new Error(serialized)
                  }
                })
                const getterName = `__getter_${key}_${prop}__`
                vm.setProp(vm.global, getterName, getterBridge)
                getterBridge.dispose()
                getterCode = getterName
              }

              // Create setter function if exists
              let setterCode = 'undefined'
              if (descriptor.set) {
                const setterBridge = vm.newFunction(`set_${prop}`, (valueHandle: any) => {
                  try {
                    const jsValue = vm.dump(valueHandle)
                    ;(context as any)[key][prop] = jsValue
                    return vm.undefined
                  } catch (err: any) {
                    const serialized = err instanceof Error ? err.message : String(err)
                    throw new Error(serialized)
                  }
                })
                const setterName = `__setter_${key}_${prop}__`
                vm.setProp(vm.global, setterName, setterBridge)
                setterBridge.dispose()
                setterCode = setterName
              }

              // Use evalCode to define the property with getter/setter
              const definePropertyCode = `
            Object.defineProperty(${key}, '${prop}', {
              enumerable: true,
              configurable: ${descriptor.configurable !== false},
              get: ${getterCode},
              set: ${setterCode}
            });
          `
              const result = vm.evalCode(definePropertyCode)
              if ('error' in result) {
                result.error?.dispose()
              } else {
                result.value.dispose()
              }
            }

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
              valueHandle !== vm.true &&
              valueHandle !== vm.false &&
              valueHandle !== vm.null &&
              valueHandle !== vm.undefined
            if (shouldDispose) {
              valueHandle.dispose()
            }
          }
        }

        // Setup variable tracking bridge
        const varTrackFnHandle = vm.newFunction(
          Identifiers.VariableTrackingFnIdentifier,
          (nameHandle, getterHandle) => {
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

              // In QuickJS, functions are dumped as their source code strings
              // Check if it's a function type or looks like function source
              if (typeof value === 'function' || (typeof value === 'string' && value.includes('=>'))) {
                variables[name] = '[[non-primitive]]'
              } else {
                variables[name] = value
              }
            } catch {
              variables[name] = '[[non-primitive]]'
            }
          }
        )
        vm.setProp(vm.global, Identifiers.VariableTrackingFnIdentifier, varTrackFnHandle)
        varTrackFnHandle.dispose()

        // Wrap code in async generator - QuickJS pattern with global variables
        // This avoids promise resolution issues by storing results in globalThis
        const scriptCode = `
"use strict";
globalThis.__llmz_result = undefined;
globalThis.__llmz_result_set = false;
globalThis.__llmz_error = null;
globalThis.__llmz_error_stack = null;
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
    // Store both the error message (which may contain serialized signal data)
    // and the stack trace from QuickJS
    // If err is a string (as thrown from promise rejection), use it directly
    // Otherwise extract the message property
    globalThis.__llmz_error = typeof err === 'string' ? err : String(err.message || err || '');
    // Force the stack to be converted to a string in QuickJS context
    globalThis.__llmz_error_stack = '' + (err.stack || '');
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
              const vmValue = vm.dump(valueResult.unwrap())
              valueResult.unwrap().dispose()
              // Update the context with the cloned value
              try {
                context[key] = vmValue
              } catch {
                // Ignore read-only property errors
              }
            } catch {
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

        // CRITICAL: Execute pending microtasks and host promises in a loop
        // QuickJS doesn't have automatic event loop, so we need to manually pump it
        const maxIterations = 1000
        let iteration = 0

        while (iteration < maxIterations) {
          // Execute all pending QuickJS microtasks
          let hasJobs = false
          const maxJobs = 10000
          for (let i = 0; i < maxJobs; i++) {
            const pending = runtime.executePendingJobs?.(-1)
            const jobCount = pending === undefined ? 0 : pending.unwrap()
            if (jobCount <= 0) break
            hasJobs = true
          }

          // Resolve all pending host promises
          const currentPromises = [...pendingPromises]
          pendingPromises.length = 0 // Clear the array for new promises

          if (currentPromises.length > 0) {
            // Check if aborted before processing promises
            if (signal?.aborted) {
              // Reject all pending promises with abort error
              const reason = (signal as any).reason
              const abortMessage =
                reason instanceof Error
                  ? `${reason.name}: ${reason.message}`
                  : reason
                    ? String(reason)
                    : 'Execution was aborted'
              for (const { deferredPromise } of currentPromises) {
                const errValue = vm.newString(abortMessage)
                deferredPromise.reject(errValue)
                errValue.dispose()
              }
              runtime.executePendingJobs()
              // Break out of the event loop - we're aborting
              break
            }

            // Create abort handler that rejects all pending promises immediately
            let abortListener: (() => void) | null = null
            if (signal) {
              abortListener = () => {
                const reason = (signal as any).reason
                const abortMessage =
                  reason instanceof Error
                    ? `${reason.name}: ${reason.message}`
                    : reason
                      ? String(reason)
                      : 'Execution was aborted'
                // Reject all pending promises immediately
                for (const { deferredPromise } of currentPromises) {
                  const errValue = vm.newString(abortMessage)
                  deferredPromise.reject(errValue)
                  errValue.dispose()
                }
                runtime.executePendingJobs()
              }
              signal.addEventListener('abort', abortListener)
            }

            try {
              await Promise.all(
                currentPromises.map(async ({ hostPromise, deferredPromise }) => {
                  // If abort was triggered, skip resolution
                  if (signal?.aborted) {
                    return
                  }

                  try {
                    const value = await hostPromise
                    // Double-check abort wasn't triggered during await
                    if (signal?.aborted) {
                      return
                    }
                    const vmValue = toVmValue(value)
                    deferredPromise.resolve(vmValue)
                  } catch (err: any) {
                    // If abort was triggered, the abort listener already rejected the promise
                    if (signal?.aborted) {
                      return
                    }

                    const serialized = err instanceof Error ? err.message : String(err)

                    // Create an Error object in QuickJS with the serialized message
                    const createErrorResult = vm.evalCode(`new Error(${JSON.stringify(serialized)})`)
                    if ('error' in createErrorResult) {
                      // Fallback to string if error creation fails
                      const errValue = vm.newString(serialized)
                      deferredPromise.reject(errValue)
                      errValue.dispose()
                    } else {
                      const errorHandle = createErrorResult.value
                      deferredPromise.reject(errorHandle)
                      errorHandle.dispose()
                    }
                  }
                })
              )
            } finally {
              // Clean up abort listener
              if (signal && abortListener) {
                signal.removeEventListener('abort', abortListener)
              }
            }

            // After resolving promises, execute pending jobs to continue the async IIFE
            runtime.executePendingJobs()

            // Check if abort was triggered during promise resolution
            if (signal?.aborted) {
              break
            }
          }

          // If no jobs and no promises, we're done
          if (!hasJobs && pendingPromises.length === 0) {
            break
          }

          iteration++
        }

        if (iteration >= maxIterations) {
          throw new Error('Maximum event loop iterations exceeded')
        }

        // NOW check for errors - AFTER all async work is complete
        const errorResult = vm.evalCode('globalThis.__llmz_error')
        const errorValue = vm.dump(errorResult.unwrap())
        errorResult.unwrap().dispose()

        // Check if aborted - take precedence over other errors
        if (signal?.aborted) {
          const reason = (signal as any).reason
          if (reason instanceof Error) {
            throw reason
          }
          throw new Error(reason ? String(reason) : 'Execution was aborted')
        }

        if (errorValue !== null && errorValue !== '') {
          // Copy back context even on error
          try {
            copyBackContextFromVM()
          } catch {
            // Ignore errors when copying context back after an error
          }

          // Get the QuickJS stack trace as well
          const errorStackResult = vm.evalCode('globalThis.__llmz_error_stack')
          const errorStack = vm.dump(errorStackResult.unwrap()) || ''
          errorStackResult.unwrap().dispose()

          // The error value is a string that may contain serialized signal data
          // Deserialize to check if it's a VMSignal
          const deserializedError = Signals.maybeDeserializeError(errorValue)

          // If it's a VMSignal, set its stack and throw it
          if (deserializedError instanceof VMSignal) {
            deserializedError.stack = errorStack
            throw deserializedError
          }

          // Otherwise create an Error with the serialized message and QuickJS stack
          const error = new Error(errorValue)
          error.stack = errorStack
          throw error
        }

        // Copy context back from VM before reading result
        copyBackContextFromVM()

        // Get result value from global AFTER promises have settled
        const resultSetResult = vm.evalCode('globalThis.__llmz_result_set')
        const resultSet = vm.dump(resultSetResult.unwrap())
        resultSetResult.unwrap().dispose()

        let returnValue: any = undefined
        if (resultSet) {
          const resultResult = vm.evalCode('globalThis.__llmz_result')
          returnValue = vm.dump(resultResult.unwrap())
          resultResult.unwrap().dispose()
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
        // Check if execution was aborted
        if (signal?.aborted) {
          // Get abort reason if available
          const reason = (signal as any).reason
          const abortError =
            reason instanceof Error ? reason : new Error(reason ? String(reason) : 'Execution was aborted')
          return handleErrorQuickJS(
            abortError,
            code,
            consumer,
            traces,
            variables,
            lines_executed,
            userCodeStartLine,
            currentToolCall
          )
        }

        // Also resolve pending promises on error before disposing
        await Promise.all(
          pendingPromises.map(async ({ hostPromise, deferredPromise }) => {
            try {
              const value = await hostPromise
              const vmValue = toVmValue(value)
              deferredPromise.resolve(vmValue)
            } catch (err2: any) {
              const serialized = err2 instanceof Error ? err2.message : String(err2)
              const errValue = vm.newString(serialized)
              deferredPromise.reject(errValue)
            }
          })
        ).catch(() => {})
        return handleErrorQuickJS(
          err,
          code,
          consumer,
          traces,
          variables,
          lines_executed,
          userCodeStartLine,
          currentToolCall
        )
      } finally {
        try {
          vm.dispose()
        } catch {}
        try {
          runtime.dispose()
        } catch {}
      }
    } catch (quickjsError: any) {
      // QuickJS failed to load or initialize - fallback to node driver
      const debugInfo = {
        error: quickjsError?.message || String(quickjsError),
        errorStack: quickjsError?.stack,
        wasmSource: (BundledReleaseSyncVariant as any)._wasmSource,
        wasmLoadedSuccessfully: (BundledReleaseSyncVariant as any)._wasmLoadedSuccessfully,
        wasmSize: (BundledReleaseSyncVariant as any)._wasmSize,
        wasmLoadError: (BundledReleaseSyncVariant as any)._wasmLoadError,
        nodeVersion: typeof process !== 'undefined' && process.version ? process.version : 'undefined',
        platform: typeof process !== 'undefined' && process.platform ? process.platform : 'undefined',
      }

      console.warn('QuickJS failed to load, falling back to node driver.')
      console.warn('Error:', quickjsError?.message || quickjsError)
      console.warn('Debug info:', JSON.stringify(debugInfo, null, 2))
      DRIVER = 'node'
    }
  }

  // ============================================================================
  // Node Driver (No VM)
  // ============================================================================
  if (DRIVER === 'node') {
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

    const AsyncFunction: (...args: unknown[]) => (...args: unknown[]) => AsyncGenerator<JsxComponent> =
      async function* () {}.constructor as any

    return await (async () => {
      // We need to track the top-level properties of the context object
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

      const reportAll = topLevelProperties.map((x) => `__report("${x}", ${x})`).join(';')

      // we're wrapping the function creation inside a promise closure to catch sync errors in the promise catch clause below
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
      .catch((err) => handleErrorNode(err, code, consumer, traces, variables, lines_executed, currentToolCall))
      .catch((err) => handleCatch(err, traces, variables, lines_executed))
  }

  throw new Error(`Unknown driver: ${DRIVER}`)
}

// ============================================================================
// QuickJS Error Handler
// ============================================================================
const handleErrorQuickJS = (
  err: Error,
  code: string,
  _consumer: SourceMapConsumer,
  traces: Traces.Trace[],
  variables: { [k: string]: any },
  lines_executed: Map<number, number>,
  userCodeStartLine: number,
  currentToolCall?: SnapshotSignal['toolCall'] | undefined
): VMExecutionResult => {
  err = Signals.maybeDeserializeError(err)
  const lines = code.split('\n')
  const stackTrace = err.stack || ''
  const LINE_OFFSET = 1

  // Parse QuickJS stack traces: "at doThrow (<quickjs>:16)" or "at <eval> (<quickjs>:58)"
  const regex = /<quickjs>:(\d+)/g

  // QuickJS line numbers include the wrapper code before transformed.code
  // The wrapper has 10 lines before transformed.code starts (counting from scriptCode template)
  const QUICKJS_WRAPPER_OFFSET = 10

  const matches = Array.from(stackTrace.matchAll(regex)).map((x) => {
    // Adjust for the wrapper offset to get the line in transformed.code
    const quickjsLine = Number(x[1])
    const transformedCodeLine = quickjsLine - QUICKJS_WRAPPER_OFFSET

    // Don't use source map for stack traces - it's unreliable due to Babel's line squashing
    // Instead, rely on retainLines keeping line numbers approximately correct
    // The transformed code lines should roughly correspond to the marker code lines
    // Add +1 because QuickJS reports the line where the IIFE starts, but the actual call is on the next line
    const line = Math.max(1, transformedCodeLine - userCodeStartLine + 1)
    const actualLine = lines[line - LINE_OFFSET] ?? ''
    const whiteSpacesCount = actualLine.length - actualLine.trimStart().length
    const minColumn = whiteSpacesCount

    return {
      line,
      column: minColumn,
    }
  })

  // If no matches found in stack trace (e.g., promise rejection from native function),
  // use the last executed line from line tracking
  if (matches.length === 0 && lines_executed.size > 0) {
    const lastLine = Math.max(...Array.from(lines_executed.keys()))
    const actualLine = lines[lastLine - LINE_OFFSET] ?? ''
    const whiteSpacesCount = actualLine.length - actualLine.trimStart().length

    matches.push({
      line: lastLine,
      column: whiteSpacesCount,
    })
  }

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

// ============================================================================
// Node Error Handler
// ============================================================================
const handleErrorNode = (
  err: Error,
  code: string,
  consumer: SourceMapConsumer,
  traces: Traces.Trace[],
  variables: { [k: string]: () => any },
  _lines_executed: Map<number, number>,
  currentToolCall?: SnapshotSignal['toolCall'] | undefined
) => {
  err = Signals.maybeDeserializeError(err)
  const lines = code.split('\n')
  const stackTrace = err.stack || ''
  const LINE_OFFSET = 1

  const regex = /<anonymous>:(\d+):(\d+)/g
  // <anonymous>:13:269)
  // ~~~~~~~~~~~~~~~~~~

  const matches = [...stackTrace.matchAll(regex)].map((x) => {
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
    const correctedStackLineIndex = i + LINE_OFFSET + VM_OFFSET // 1 for the array index starting at 0, then 2 is the number of lines added by the sandbox
    const match = matches.find((x) => x.line + VM_OFFSET === correctedStackLineIndex)
    // add line number padded with 000 to the lines below
    const paddedLineNumber = String(correctedStackLineIndex - VM_OFFSET - DISPLAY_OFFSET).padStart(3, '0')

    if (match) {
      appendCode(`> ${paddedLineNumber} | ${line}\n`)
      appendCode(`    ${' '.repeat(paddedLineNumber.length + match.column)}^^^^^^^^^^\n`)
      if (match.line >= lastLine) {
        // we want to keep the code up to the location of the top-level error (which is not necessarily the first error we will traverse in the stack trace)
        truncated = true
      }
    } else {
      appendCode(`  ${paddedLineNumber} | ${line}\n`)
    }
  }

  debugUserCode = cleanStackTrace(debugUserCode).trim()
  truncatedCode = cleanStackTrace(truncatedCode).trim()

  if (err instanceof VMSignal) {
    err.stack = debugUserCode
    err.truncatedCode = truncatedCode
    err.variables = mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter))
    err.toolCall = currentToolCall
    throw err
  } else {
    traces.push({
      type: 'code_execution_exception',
      position: [matches[0]?.line ?? 0, matches[0]?.column ?? 0],
      message: err.message,
      stackTrace: debugUserCode,
      started_at: Date.now(),
    })
    throw new CodeExecutionError(err.message, code, debugUserCode)
  }
}

const handleCatch = (
  err: Error,
  traces: Traces.Trace[],
  variables: { [k: string]: () => any },
  lines_executed: Map<number, number>
) => {
  err = Signals.maybeDeserializeError(err)
  return {
    success: err instanceof VMSignal ? true : false,
    variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
    error: err,
    signal: err instanceof VMSignal ? err : undefined,
    traces,
    lines_executed: Array.from(lines_executed),
  } satisfies VMExecutionResult
}
