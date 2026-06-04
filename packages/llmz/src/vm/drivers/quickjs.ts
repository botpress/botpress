import { isFunction, mapValues } from 'lodash-es'
import {
  newQuickJSWASMModuleFromVariant,
  QuickJSContext,
  type QuickJSHandle,
  shouldInterruptAfterDeadline,
} from 'quickjs-emscripten-core'

import { Identifiers } from '../../compiler/index.js'
import { Signals, VMSignal } from '../../errors.js'
import { BundledReleaseSyncVariant } from '../../quickjs-variant.js'
import type { VMExecutionResult } from '../../types.js'
import { handleErrorQuickJS } from '../errors.js'
import { NO_TRACKING, findUserCodeStartLine, instrumentContext } from '../instrument.js'
import type { DriverExecutionContext, VMContext, VMDriver } from '../types.js'

// Sandboxed execution via QuickJS WASM. All host values must be manually marshalled
// across the boundary — QuickJS has its own heap, separate from Node.js.
export class QuickJSDriver implements VMDriver {
  public async execute(ctx: DriverExecutionContext): Promise<VMExecutionResult> {
    const { transformed, consumer, context, traces, signal, timeout, code, lines_executed, variables } = ctx

    const userCodeStartLine = findUserCodeStartLine(transformed)
    const state = instrumentContext(
      context,
      transformed,
      traces,
      variables,
      lines_executed,
      consumer,
      userCodeStartLine
    )

    const QuickJS = await newQuickJSWASMModuleFromVariant(BundledReleaseSyncVariant)
    const runtime = QuickJS.newRuntime()
    runtime.setMemoryLimit(128 * 1024 * 1024)

    const startTime = Date.now()
    const timeoutHandler = shouldInterruptAfterDeadline(startTime + timeout)
    runtime.setInterruptHandler(() => {
      if (signal?.aborted) {
        return true
      }
      return timeoutHandler(runtime)
    })

    const vm = runtime.newContext()
    const trackedProperties = new Set<string>()
    const referenceProperties = new Set<string>()
    const pendingPromises: Array<{ hostPromise: Promise<any>; deferredPromise: any }> = []

    // Convert a host JS value into a QuickJS handle (the WASM equivalent)
    const toVmValue = (value: any): QuickJSHandle => {
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
        const items = value.map((item) => {
          if (typeof item === 'string') return JSON.stringify(item)
          else if (typeof item === 'number' || typeof item === 'boolean') return String(item)
          else if (item === null) return 'null'
          else if (item === undefined) return 'undefined'
          else if (typeof item === 'object') return JSON.stringify(item)
          return 'undefined'
        })
        const result = vm.evalCode(`[${items.join(',')}]`)
        if ('error' in result) {
          result.error?.dispose()
          return vm.undefined
        }
        return result.value
      } else if (typeof value === 'object') {
        const obj = vm.newObject()
        for (const [k, v] of Object.entries(value)) {
          if (typeof v !== 'function') {
            const propHandle = toVmValue(v)
            vm.setProp(obj, k, propHandle)
            disposeIfNeeded(propHandle)
          }
        }
        return obj
      }
      return vm.undefined
    }

    // Singleton handles (true/false/null/undefined) must not be disposed
    const disposeIfNeeded = (handle: QuickJSHandle) => {
      if (handle !== vm.true && handle !== vm.false && handle !== vm.null && handle !== vm.undefined) {
        ;(handle as any).dispose()
      }
    }

    // Wrap a host function so QuickJS can call it: unmarshal args, call host, marshal result back.
    // Async results become QuickJS deferred promises, resolved by _pumpEventLoop.
    const bridgeFunction = (fn: Function, _fnName: string = 'anonymous') => {
      return (...argHandles: any[]) => {
        const args = argHandles.map((h: any) => vm.dump(h))
        try {
          const result = fn(...args)
          if (result && typeof result.then === 'function') {
            const promise = vm.newPromise()
            pendingPromises.push({ hostPromise: result, deferredPromise: promise })
            void promise.settled.then(() => {
              if (runtime.alive) {
                runtime.executePendingJobs()
              }
            })
            return promise.handle
          }
          return toVmValue(result)
        } catch (err) {
          const serialized = err instanceof Error ? err.message : String(err)
          throw new Error(serialized)
        }
      }
    }

    try {
      bridgeContextToVM(context, vm, trackedProperties, referenceProperties, toVmValue, disposeIfNeeded, bridgeFunction)

      setupVariableTrackingBridge(vm, variables)

      const scriptCode = buildScriptCode(transformed.code)

      const copyBackContextFromVM = () => {
        for (const key of trackedProperties) {
          if (referenceProperties.has(key)) continue
          try {
            const valueResult = vm.evalCode(`globalThis['${key}']`)
            const vmValue = vm.dump(valueResult.unwrap())
            valueResult.unwrap().dispose()
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

      await this._pumpEventLoop(runtime, vm, pendingPromises, signal, toVmValue, disposeIfNeeded)

      const errorResult = vm.evalCode('globalThis.__llmz_error')
      const errorValue = vm.dump(errorResult.unwrap())
      errorResult.unwrap().dispose()

      if (signal?.aborted) {
        const reason = (signal as any).reason
        if (reason instanceof Error) throw reason
        throw new Error(reason ? String(reason) : 'Execution was aborted')
      }

      if (errorValue !== null && errorValue !== '') {
        try {
          copyBackContextFromVM()
        } catch {}

        const errorStackResult = vm.evalCode('globalThis.__llmz_error_stack')
        const errorStack = vm.dump(errorStackResult.unwrap()) || ''
        errorStackResult.unwrap().dispose()

        const deserializedError = Signals.maybeDeserializeError(errorValue)

        if (deserializedError instanceof VMSignal) {
          deserializedError.stack = errorStack
          throw deserializedError
        }

        const error = new Error(errorValue)
        error.stack = errorStack
        throw error
      }

      copyBackContextFromVM()

      const resultSetResult = vm.evalCode('globalThis.__llmz_result_set')
      const resultSet = vm.dump(resultSetResult.unwrap())
      resultSetResult.unwrap().dispose()

      let returnValue: any = undefined
      if (resultSet) {
        const resultResult = vm.evalCode('globalThis.__llmz_result')
        returnValue = vm.dump(resultResult.unwrap())
        resultResult.unwrap().dispose()
      }

      returnValue = Signals.maybeDeserializeError(returnValue)

      return {
        success: true,
        variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
        signal: returnValue instanceof VMSignal ? returnValue : undefined,
        lines_executed: Array.from(lines_executed),
        return_value: returnValue,
      } satisfies VMExecutionResult
    } catch (err: any) {
      if (signal?.aborted) {
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
          ctx.currentToolCall ?? state.currentToolCall
        )
      }

      await Promise.all(
        pendingPromises.map(async ({ hostPromise, deferredPromise }) => {
          try {
            const value = await hostPromise
            const vmValue = toVmValue(value)
            deferredPromise.resolve(vmValue)
            disposeIfNeeded(vmValue)
          } catch (err2: any) {
            const serialized = err2 instanceof Error ? err2.message : String(err2)
            const errValue = vm.newString(serialized)
            deferredPromise.reject(errValue)
            errValue.dispose()
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
        ctx.currentToolCall ?? state.currentToolCall
      )
    } finally {
      try {
        vm.dispose()
      } catch {}
      try {
        runtime.dispose()
      } catch {}
    }
  }

  // QuickJS has no event loop — we manually drain pending microtasks and resolve
  // host promises in a loop until all async work completes or the signal aborts.
  private async _pumpEventLoop(
    runtime: any,
    vm: any,
    pendingPromises: Array<{ hostPromise: Promise<any>; deferredPromise: any }>,
    signal: AbortSignal | null,
    toVmValue: (value: any) => QuickJSHandle,
    disposeIfNeeded: (handle: QuickJSHandle) => void
  ) {
    const maxIterations = 1000
    let iteration = 0

    while (iteration < maxIterations) {
      let hasJobs = false
      const maxJobs = 10000
      for (let i = 0; i < maxJobs; i++) {
        const pending = runtime.executePendingJobs?.(-1)
        const jobCount = pending === undefined ? 0 : pending.unwrap()
        if (jobCount <= 0) break
        hasJobs = true
      }

      const currentPromises = [...pendingPromises]
      pendingPromises.length = 0

      if (currentPromises.length > 0) {
        if (signal?.aborted) {
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
          break
        }

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
              if (signal?.aborted) return
              try {
                const value = await hostPromise
                if (signal?.aborted) return
                const vmValue = toVmValue(value)
                deferredPromise.resolve(vmValue)
                disposeIfNeeded(vmValue)
              } catch (err: any) {
                if (signal?.aborted) return
                const serialized = err instanceof Error ? err.message : String(err)
                const createErrorResult = vm.evalCode(`new Error(${JSON.stringify(serialized)})`)
                if ('error' in createErrorResult) {
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
          if (signal && abortListener) {
            signal.removeEventListener('abort', abortListener)
          }
        }

        runtime.executePendingJobs()

        if (signal?.aborted) break
      }

      if (!hasJobs && pendingPromises.length === 0) break
      iteration++
    }

    if (iteration >= maxIterations) {
      throw new Error('Maximum event loop iterations exceeded')
    }
  }
}

// Marshal all context entries (functions, objects, arrays, primitives, getter/setters)
// onto QuickJS globalThis so generated code can access them.
function bridgeContextToVM(
  // TODO: rename these and their associated concepts, these types ain't making sense
  context: VMContext,
  vm: QuickJSContext,
  trackedProperties: Set<string>,
  referenceProperties: Set<string>,
  toVmValue: (value: any) => QuickJSHandle,
  disposeIfNeeded: (handle: QuickJSHandle) => void,
  bridgeFunction: (fn: Function, name?: string) => (...args: any[]) => any
) {
  for (const [key, value] of Object.entries(context)) {
    const descriptor = Object.getOwnPropertyDescriptor(context, key)

    if (descriptor && (descriptor.get || descriptor.set)) {
      referenceProperties.add(key)
      trackedProperties.add(key)
      bridgeGetterSetter(vm, key, undefined, descriptor, context, toVmValue)
      continue
    }

    if (typeof value === 'function') {
      const fnHandle = vm.newFunction(key, bridgeFunction(value, key))
      vm.setProp(vm.global, key, fnHandle)
      fnHandle.dispose()
    } else if (Array.isArray(value)) {
      trackedProperties.add(key)
      const arrayHandle = toVmValue(value)
      vm.setProp(vm.global, key, arrayHandle)
      disposeIfNeeded(arrayHandle)
    } else if (typeof value === 'object' && value !== null) {
      trackedProperties.add(key)
      const objHandle = vm.newObject()
      const props = new Set([...Object.keys(value), ...Object.getOwnPropertyNames(value)])
      const getterSetterProps: Array<{ prop: string; descriptor: PropertyDescriptor }> = []

      for (const prop of props) {
        const propDescriptor = Object.getOwnPropertyDescriptor(value, prop)
        if (propDescriptor && (propDescriptor.get || propDescriptor.set)) {
          referenceProperties.add(`${key}.${prop}`)
          getterSetterProps.push({ prop, descriptor: propDescriptor })
        } else if (typeof (value as any)[prop] === 'function') {
          const propFnHandle = vm.newFunction(prop, bridgeFunction((value as any)[prop], `${key}.${prop}`))
          vm.setProp(objHandle, prop, propFnHandle)
          propFnHandle.dispose()
        } else {
          const propHandle = toVmValue((value as any)[prop])
          vm.setProp(objHandle, prop, propHandle)
          disposeIfNeeded(propHandle)
        }
      }

      vm.setProp(vm.global, key, objHandle)
      objHandle.dispose()

      for (const { prop, descriptor } of getterSetterProps) {
        bridgeGetterSetter(vm, key, prop, descriptor, context, toVmValue)
      }

      if (Object.isSealed(value)) {
        const sealResult = vm.evalCode(`Object.seal(globalThis['${key}']);`)
        if ('error' in sealResult) sealResult.error?.dispose()
        else sealResult.value.dispose()
      }
      if (!Object.isExtensible(value)) {
        const preventResult = vm.evalCode(`Object.preventExtensions(globalThis['${key}']);`)
        if ('error' in preventResult) preventResult.error?.dispose()
        else preventResult.value.dispose()
      }
    } else {
      trackedProperties.add(key)
      const valueHandle = toVmValue(value)
      vm.setProp(vm.global, key, valueHandle)
      disposeIfNeeded(valueHandle)
    }
  }
}

// Bridge a getter/setter property across the host-QuickJS boundary using Object.defineProperty
function bridgeGetterSetter(
  vm: QuickJSContext,
  key: string,
  prop: string | undefined,
  descriptor: PropertyDescriptor,
  context: VMContext,
  toVmValue: (value: any) => QuickJSHandle
) {
  const target = prop ? `${key}` : 'globalThis'
  const propName = prop ?? key
  const prefix = prop ? `${key}_${prop}` : key

  let getterCode = 'undefined'
  if (descriptor.get) {
    const getterBridge = vm.newFunction(`get_${propName}`, () => {
      try {
        const hostValue = prop ? context[key][prop] : context[key]
        return toVmValue(hostValue)
      } catch (err: any) {
        throw new Error(err instanceof Error ? err.message : String(err))
      }
    })
    const getterName = `__getter_${prefix}__`
    vm.setProp(vm.global, getterName, getterBridge)
    getterBridge.dispose()
    getterCode = getterName
  }

  let setterCode = 'undefined'
  if (descriptor.set) {
    const setterBridge = vm.newFunction(`set_${propName}`, (valueHandle: any) => {
      try {
        const jsValue = vm.dump(valueHandle)
        if (prop) {
          context[key][prop] = jsValue
        } else {
          context[key] = jsValue
        }
        return vm.undefined
      } catch (err: any) {
        throw new Error(err instanceof Error ? err.message : String(err))
      }
    })
    const setterName = `__setter_${prefix}__`
    vm.setProp(vm.global, setterName, setterBridge)
    setterBridge.dispose()
    setterCode = setterName
  }

  const definePropertyCode = `
    Object.defineProperty(${target}, '${propName}', {
      enumerable: true,
      configurable: ${descriptor.configurable !== false},
      get: ${getterCode},
      set: ${setterCode}
    });
  `
  const result = vm.evalCode(definePropertyCode)
  if ('error' in result) result.error?.dispose()
  else result.value.dispose()
}

// QuickJS-specific variable tracking: uses vm.callFunction to invoke getter handles inside the VM
function setupVariableTrackingBridge(vm: QuickJSContext, variables: Record<string, any>) {
  const varTrackFnHandle = vm.newFunction(
    Identifiers.VariableTrackingFnIdentifier,
    (nameHandle: any, getterHandle: any) => {
      const name = vm.getString(nameHandle)
      if (NO_TRACKING.includes(name)) return

      try {
        const valueResult = vm.callFunction(getterHandle, vm.undefined)
        if ('error' in valueResult) {
          variables[name] = '[[non-primitive]]'
          valueResult.error?.dispose()
          return
        }
        const value = vm.dump(valueResult.value)
        valueResult.value.dispose()

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
}

// Wraps transformed code in an async generator IIFE that stores results/errors on globalThis.
// QuickJS can't return values from async code directly, so we read them back after the event loop.
function buildScriptCode(transformedCode: string): string {
  return `
"use strict";
globalThis.__llmz_result = undefined;
globalThis.__llmz_result_set = false;
globalThis.__llmz_error = null;
globalThis.__llmz_error_stack = null;
globalThis.__llmz_yields = [];

(async () => {
  try {
    async function* __fn__() {
${transformedCode}
    }

    const fn = __fn__();
    let iteration = 0;
    const maxIterations = 10000;

    while (iteration < maxIterations) {
      const { value, done } = await fn.next();

      if (done) {
        globalThis.__llmz_result = value;
        globalThis.__llmz_result_set = true;
        break;
      }

      globalThis.__llmz_yields.push(value);
      await ${Identifiers.AsyncIterYieldFnIdentifier}(value);
      iteration++;
    }

    if (iteration >= maxIterations) {
      throw new Error('Maximum iterations exceeded');
    }
  } catch (err) {
    globalThis.__llmz_error = typeof err === 'string' ? err : String(err.message || err || '');
    globalThis.__llmz_error_stack = '' + (err.stack || '');
  }
})();
`.trim()
}
