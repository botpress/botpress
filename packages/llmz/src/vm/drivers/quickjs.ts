import { isFunction, mapValues } from 'lodash-es'
import {
  newQuickJSWASMModuleFromVariant,
  QuickJSContext,
  type QuickJSHandle,
  type QuickJSSyncVariant,
  type QuickJSWASMModule,
  shouldInterruptAfterDeadline,
} from 'quickjs-emscripten-core'
import { Identifiers } from '../../compiler/index.js'
import { TerminationCheckpointIdentifier, TerminationGuardIdentifier } from '../../compiler/plugins/termination.js'
import { Signals, VMSignal } from '../../errors.js'
import { cloneMemoryValue, decodeMemoryValue } from '../../memory.js'
import { getQuickJSVariant } from '../../quickjs-variant.js'
import { RUNTIME_BINDING_NAMES, TERMINATION_BINDING_NAMES } from '../../runtime-names.js'
import type { VMExecutionResult } from '../../types.js'
import { handleErrorQuickJS } from '../errors.js'
import {
  type InstrumentationState,
  finalizeMemoryCapture,
  NO_TRACKING,
  findUserCodeStartLine,
  instrumentContext,
} from '../instrument.js'
import {
  VM_PROGRAM_COMPLETE,
  VM_TERMINATION,
  type DriverExecutionContext,
  type VMContext,
  type VMDriver,
} from '../types.js'
// The WASM module is compiled once per process and shared by every execution
// (each execution still gets its own runtime + context). Loading it eagerly —
// e.g. while the LLM is still generating code — hides the instantiation cost.
// The cache is keyed on the active variant so a configureQuickJS() call made
// after a load takes effect on the next execution.
let _quickJSModule: Promise<QuickJSWASMModule> | undefined
let _loadedVariant: QuickJSSyncVariant | undefined
export const loadQuickJSModule = (): Promise<QuickJSWASMModule> => {
  const variant = getQuickJSVariant()
  if (!_quickJSModule || _loadedVariant !== variant) {
    _loadedVariant = variant
    _quickJSModule = newQuickJSWASMModuleFromVariant(variant)
  }

  return _quickJSModule
}

// Sandboxed execution via QuickJS WASM. All host values must be manually marshalled
// across the boundary — QuickJS has its own heap, separate from Node.js.
export class QuickJSDriver implements VMDriver {
  public async execute(ctx: DriverExecutionContext): Promise<VMExecutionResult> {
    const { transformed, consumer, context, traces, recordTrace, signal, timeout, code, lines_executed, variables } =
      ctx
    const userCodeStartLine = findUserCodeStartLine(transformed)
    const state = instrumentContext(
      context,
      transformed,
      recordTrace,
      variables,
      lines_executed,
      consumer,
      userCodeStartLine,
      ctx.memoryNames
    )
    const isTerminated = () => context[VM_TERMINATION]?.isTerminated() ?? false

    // Let interrupted host promises propagate their signals. Guards prevent
    // user code from continuing after the interruption.
    const shouldStopJobs = () => isTerminated() && !context[VM_TERMINATION]?.getSignal?.()

    const terminalResult = (): VMExecutionResult => {
      const interruption = context[VM_TERMINATION]?.getSignal?.()

      if (interruption) {
        return finalizeMemoryCapture(
          handleErrorQuickJS(
            interruption,
            code,
            consumer,
            traces,
            variables,
            lines_executed,
            userCodeStartLine,
            recordTrace
          ),
          state
        )
      }

      return finalizeMemoryCapture(
        {
          success: true,
          variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
          lines_executed: Array.from(lines_executed),
        },
        state
      )
    }

    const QuickJS = await loadQuickJSModule()
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
    const pendingPromises: Array<{
      hostPromise: Promise<any>
      deferredPromise: any
    }> = []
    const variableGetters = new Map<string, QuickJSHandle>()
    let captureValue: ((handle: QuickJSHandle) => unknown) | undefined
    const objectConstructor = vm.getProp(vm.global, 'Object')
    const freezeFunction = vm.getProp(objectConstructor, 'freeze')
    objectConstructor.dispose()

    const preserveHostFreeze = (hostValue: unknown, handle: QuickJSHandle, preserveFrozen: boolean) => {
      if (!preserveFrozen || !Object.isFrozen(hostValue)) {
        return handle
      }

      const frozen = vm.callFunction(freezeFunction, vm.undefined, handle)
      if ('error' in frozen) {
        const error = vm.dump(frozen.error!)
        frozen.error!.dispose()
        handle.dispose()
        throw new Error(error.message)
      }

      frozen.value.dispose()
      return handle
    }

    // Convert a host JS value into a QuickJS handle (the WASM equivalent)
    const toVmValue = (value: any, preserveFrozen = false): QuickJSHandle => {
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
        const array = vm.newArray()
        value.forEach((item, index) => {
          const handle = toVmValue(item, preserveFrozen)
          vm.setProp(array, index, handle)
          disposeIfNeeded(handle)
        })
        return preserveHostFreeze(value, array, preserveFrozen)
      } else if (typeof value === 'object') {
        const obj = vm.newObject()
        for (const [k, v] of Object.entries(value)) {
          if (typeof v !== 'function') {
            const propHandle = toVmValue(v, preserveFrozen)
            vm.setProp(obj, k, propHandle)
            disposeIfNeeded(propHandle)
          }
        }

        return preserveHostFreeze(value, obj, preserveFrozen)
      }

      return vm.undefined
    }
    // Singleton handles (true/false/null/undefined) must not be disposed
    const disposeIfNeeded = (handle: QuickJSHandle) => {
      if (handle !== vm.true && handle !== vm.false && handle !== vm.null && handle !== vm.undefined) {
        handle.dispose()
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
            const hostPromise = Promise.resolve(result).then((value: unknown) => cloneMemoryValue(value))
            // Cancellation can stop the VM before its event loop consumes a rejected host result.
            // Attach a handler immediately, while retaining the original promise for normal error propagation.
            void hostPromise.catch(() => {})
            pendingPromises.push({
              hostPromise,
              deferredPromise: promise,
            })
            void promise.settled.then(() => {
              if (runtime.alive && !shouldStopJobs()) {
                runtime.executePendingJobs()
              }
            })
            return promise.handle
          }

          return toVmValue(cloneMemoryValue(result))
        } catch (err) {
          const serialized = err instanceof Error ? err.message : String(err)
          throw new Error(serialized)
        }
      }
    }
    try {
      captureValue = setupMemoryCapture(vm)
      bridgeContextToVM(
        context,
        vm,
        trackedProperties,
        referenceProperties,
        toVmValue,
        disposeIfNeeded,
        bridgeFunction,
        captureValue
      )
      setupVariableTrackingBridge(vm, variables, variableGetters, state, captureValue)
      const checkpoint = vm.evalCode(`(() => {
        const then = Promise.prototype.then;
        const check = globalThis.${TerminationGuardIdentifier};
        globalThis.${TerminationCheckpointIdentifier} = (value) => {
          if (value instanceof Promise) {
            then.call(value, undefined, () => {});
          }
          check();
          return value;
        };
      })()`)
      checkpoint.unwrap().dispose()
      const complete = vm.newFunction('__llmz_program_complete', () => {
        context[VM_PROGRAM_COMPLETE]?.()
        return vm.undefined
      })
      vm.setProp(vm.global, '__llmz_program_complete', complete)
      complete.dispose()
      for (const name of ctx.memoryNames) {
        const tracked = vm.evalCode(
          `${Identifiers.VariableTrackingFnIdentifier}(${JSON.stringify(name)}, () => globalThis[${JSON.stringify(name)}], undefined, "read");`
        )
        if ('error' in tracked) {
          tracked.error?.dispose()
        } else {
          tracked.value.dispose()
        }
      }

      // Native globals are immutable as bindings and deeply immutable as values.
      const protect = vm.evalCode(`(() => {
        function freeze(value) {
          if (value && (typeof value === 'object' || typeof value === 'function') && !Object.isFrozen(value)) {
            Object.values(value).forEach(freeze);
            Object.freeze(value);
          }
          return value;
        }
        for (const name of ${JSON.stringify([...RUNTIME_BINDING_NAMES, ...TERMINATION_BINDING_NAMES, '__llmz_program_complete'])}) {
          if (Object.prototype.hasOwnProperty.call(globalThis, name)) {
            Object.defineProperty(globalThis, name, {
              value: freeze(globalThis[name]),
              writable: false,
              configurable: false,
            });
          }
        }
      })()`)
      if ('error' in protect) {
        const error = vm.dump(protect.error!)
        protect.error!.dispose()
        throw new Error(error.message)
      }

      protect.value.dispose()
      const scriptCode = buildScriptCode(transformed.code)
      const copyBackContextFromVM = () => {
        for (const key of trackedProperties) {
          if (referenceProperties.has(key)) {
            continue
          }

          try {
            const valueResult = vm.evalCode(`globalThis['${key}']`)
            const handle = valueResult.unwrap()
            try {
              const vmValue = ctx.memoryNames.includes(key) ? captureValue!(handle) : vm.dump(handle)
              try {
                context[key] = vmValue
              } catch {
                // Ignore read-only property errors
              }
            } finally {
              handle.dispose()
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
      await this._pumpEventLoop(runtime, vm, pendingPromises, signal, toVmValue, disposeIfNeeded, shouldStopJobs)

      if (isTerminated()) {
        copyBackContextFromVM()
        return terminalResult()
      }

      const errorResult = vm.evalCode('globalThis.__llmz_error')
      const errorValue = vm.dump(errorResult.unwrap())
      errorResult.unwrap().dispose()
      if (signal?.aborted) {
        const reason = (signal as any).reason
        if (reason instanceof Error) {
          throw reason
        }

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
        const errorNameResult = vm.evalCode('globalThis.__llmz_error_name')
        error.name = vm.dump(errorNameResult.unwrap()) || 'Error'
        errorNameResult.unwrap().dispose()
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
        const resultHandle = resultResult.unwrap()
        try {
          returnValue = captureValue!(resultHandle)
        } catch (err) {
          state.captureErrors.push({
            name: '$return',
            reason: err instanceof Error ? err.message : String(err),
          })
        } finally {
          resultHandle.dispose()
        }
      }

      returnValue = Signals.maybeDeserializeError(returnValue)
      return finalizeMemoryCapture(
        {
          success: true,
          variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
          signal: returnValue instanceof VMSignal ? returnValue : undefined,
          lines_executed: Array.from(lines_executed),
          return_value: returnValue,
          variableWrites: state.variableWrites,
          captureErrors: state.captureErrors,
        } satisfies VMExecutionResult,
        state
      )
    } catch (err: any) {
      // Capturing plain values must remain possible after a timeout or cancellation.
      runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + 1000))
      if (isTerminated()) {
        return terminalResult()
      }

      if (signal?.aborted) {
        const reason = (signal as any).reason
        const abortError =
          reason instanceof Error ? reason : new Error(reason ? String(reason) : 'Execution was aborted')
        return finalizeMemoryCapture(
          handleErrorQuickJS(
            abortError,
            code,
            consumer,
            traces,
            variables,
            lines_executed,
            userCodeStartLine,
            recordTrace
          ),
          state
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
      return finalizeMemoryCapture(
        handleErrorQuickJS(err, code, consumer, traces, variables, lines_executed, userCodeStartLine, recordTrace),
        state
      )
    } finally {
      context[VM_PROGRAM_COMPLETE]?.()

      for (const { deferredPromise } of pendingPromises) {
        deferredPromise.dispose()
      }

      for (const getter of variableGetters.values()) {
        getter.dispose()
      }

      freezeFunction.dispose()
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
    pendingPromises: Array<{
      hostPromise: Promise<any>
      deferredPromise: any
    }>,
    signal: AbortSignal | null,
    toVmValue: (value: any, preserveFrozen?: boolean) => QuickJSHandle,
    disposeIfNeeded: (handle: QuickJSHandle) => void,
    shouldStopJobs: () => boolean
  ) {
    const maxIterations = 1000
    let iteration = 0
    while (iteration < maxIterations) {
      if (shouldStopJobs()) {
        break
      }

      let hasJobs = false
      const maxJobs = 10000
      for (let i = 0; i < maxJobs; i++) {
        const pending = runtime.executePendingJobs?.(-1)
        const jobCount = pending === undefined ? 0 : pending.unwrap()
        if (jobCount <= 0 || shouldStopJobs()) {
          break
        }

        hasJobs = true
      }

      const currentPromises = [...pendingPromises]
      pendingPromises.length = 0
      if (currentPromises.length > 0) {
        if (signal?.aborted) {
          const reason = (signal as any).reason
          const abortMessage = describeAbortReason(reason)
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
            const abortMessage = describeAbortReason(reason)
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
              if (signal?.aborted || shouldStopJobs()) {
                return
              }

              try {
                const value = await hostPromise
                if (signal?.aborted || shouldStopJobs()) {
                  return
                }

                const vmValue = toVmValue(value)
                deferredPromise.resolve(vmValue)
                disposeIfNeeded(vmValue)
              } catch (err: any) {
                if (signal?.aborted || shouldStopJobs()) {
                  return
                }

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

          if (shouldStopJobs()) {
            currentPromises.forEach(({ deferredPromise }) => deferredPromise.dispose())
          }
        }

        if (!shouldStopJobs()) {
          runtime.executePendingJobs()
        }

        if (signal?.aborted || shouldStopJobs()) {
          break
        }
      }

      if (!hasJobs && pendingPromises.length === 0) {
        break
      }

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
  toVmValue: (value: any, preserveFrozen?: boolean) => QuickJSHandle,
  disposeIfNeeded: (handle: QuickJSHandle) => void,
  bridgeFunction: (fn: Function, name?: string) => (...args: any[]) => any,
  captureValue: (handle: QuickJSHandle) => unknown
) {
  for (const [key, value] of Object.entries(context)) {
    const descriptor = Object.getOwnPropertyDescriptor(context, key)
    if (descriptor && (descriptor.get || descriptor.set)) {
      referenceProperties.add(key)
      trackedProperties.add(key)
      bridgeGetterSetter(vm, key, undefined, descriptor, context, toVmValue, captureValue)
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
      const getterSetterProps: Array<{
        prop: string
        descriptor: PropertyDescriptor
      }> = []
      for (const prop of props) {
        const propDescriptor = Object.getOwnPropertyDescriptor(value, prop)
        if (propDescriptor && (propDescriptor.get || propDescriptor.set)) {
          referenceProperties.add(`${key}.${prop}`)
          getterSetterProps.push({
            prop,
            descriptor: propDescriptor,
          })
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
        bridgeGetterSetter(vm, key, prop, descriptor, context, toVmValue, captureValue)
      }

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
  toVmValue: (value: any, preserveFrozen?: boolean) => QuickJSHandle,
  captureValue: (handle: QuickJSHandle) => unknown
) {
  const target = prop ? `${key}` : 'globalThis'
  const propName = prop ?? key
  const prefix = prop ? `${key}_${prop}` : key
  let getterCode = 'undefined'
  if (descriptor.get) {
    const getterBridge = vm.newFunction(`get_${propName}`, () => {
      try {
        const hostValue = prop ? context[key][prop] : context[key]
        return toVmValue(hostValue, true)
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
        const jsValue = captureValue(valueHandle)
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
  if ('error' in result) {
    result.error?.dispose()
  } else {
    result.value.dispose()
  }
}

// Capture inside QuickJS before vm.dump can silently JSON-coerce unsupported values.
function setupMemoryCapture(vm: QuickJSContext): (handle: QuickJSHandle) => unknown {
  const installed = vm.evalCode(`
    globalThis.__llmz_encode_memory = function encode(value, seen = new Set()) {
      if (value === undefined) {
        return ['undefined'];
      }
      if (Object.is(value, -0)) {
        return ['negative-zero'];
      }
      if (value === null || typeof value === 'boolean' || typeof value === 'string') {
        return ['value', value];
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return ['value', value];
      }
      if (!value || typeof value !== 'object') {
        throw new Error('Unsupported memory value: ' + typeof value);
      }
      if (seen.has(value)) {
        throw new Error('Cyclic values cannot be retained in memory');
      }
      const plainObject = Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null;
      if (!Array.isArray(value) && !plainObject) {
        throw new Error('Only plain objects and arrays can be retained in memory');
      }
      if (Object.getOwnPropertySymbols(value).length) {
        throw new Error('Symbol properties cannot be retained in memory');
      }
      seen.add(value);
      try {
        if (Array.isArray(value)) {
          if (Object.keys(value).length !== value.length) {
            throw new Error('Sparse arrays and custom array properties are unsupported');
          }
          const items = [];
          for (let index = 0; index < value.length; index++) {
            const descriptor = Object.getOwnPropertyDescriptor(value, index);
            if (!descriptor || descriptor.get || descriptor.set) {
              throw new Error('Array accessor properties cannot be retained in memory');
            }
            items.push(encode(descriptor.value, seen));
          }
          return ['array', items];
        }
        const entries = [];
        for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
          if (descriptor.get || descriptor.set || !descriptor.enumerable) {
            throw new Error('Accessor and non-enumerable properties cannot be retained in memory');
          }
          entries.push([key, encode(descriptor.value, seen)]);
        }
        return ['object', entries];
      } finally {
        seen.delete(value);
      }
    };
  `)
  if ('error' in installed) {
    const error = vm.dump(installed.error!)
    installed.error!.dispose()
    throw new Error(error.message)
  }

  installed.value.dispose()
  return (handle) => {
    const encoder = vm.getProp(vm.global, '__llmz_encode_memory')
    try {
      const encoded = vm.callFunction(encoder, vm.undefined, handle)
      if ('error' in encoded) {
        const error = vm.dump(encoded.error!)
        encoded.error!.dispose()
        throw new Error(error.message)
      }

      try {
        return decodeMemoryValue(vm.dump(encoded.value))
      } finally {
        encoded.value.dispose()
      }
    } finally {
      encoder.dispose()
    }
  }
}

// Keep getters alive until settlement so assignments and nested mutations are captured.
function setupVariableTrackingBridge(
  vm: QuickJSContext,
  variables: Record<string, any>,
  getters: Map<string, QuickJSHandle>,
  state: InstrumentationState,
  capture: (handle: QuickJSHandle) => unknown
) {
  const tracker = vm.newFunction(
    Identifiers.VariableTrackingFnIdentifier,
    (nameHandle, getterHandle, resultHandle, kindHandle) => {
      const name = vm.getString(nameHandle)
      if (NO_TRACKING.includes(name) || !state.memoryNames.has(name)) {
        return resultHandle?.dup() ?? vm.undefined
      }

      const kind = kindHandle ? vm.dump(kindHandle) : 'assignment'
      if (kind !== 'initialize' && kind !== 'read') {
        state.variableWrites.push({
          name,
          timestamp: Date.now(),
          kind: kind === 'mutation' ? 'mutation' : 'assignment',
        })
      }

      getters.get(name)?.dispose()
      getters.set(name, getterHandle.dup())
      variables[name] = () => {
        try {
          const result = vm.callFunction(getters.get(name)!, vm.undefined)
          if ('error' in result) {
            const error = vm.dump(result.error!)
            result.error!.dispose()
            throw new Error(error.message)
          }

          try {
            return capture(result.value)
          } finally {
            result.value.dispose()
          }
        } catch (err) {
          if (!state.captureErrors.some((entry) => entry.name === name)) {
            state.captureErrors.push({
              name,
              reason: err instanceof Error ? err.message : String(err),
            })
          }

          return undefined
        }
      }
      return resultHandle?.dup() ?? vm.undefined
    }
  )
  vm.setProp(vm.global, Identifiers.VariableTrackingFnIdentifier, tracker)
  tracker.dispose()
}

// Wraps transformed code in an async IIFE that stores the result/error on globalThis.
// QuickJS can't return values from async code directly, so we read them back after the event loop.
function buildScriptCode(transformedCode: string): string {
  return `
"use strict";
globalThis.__llmz_result = undefined;
globalThis.__llmz_result_set = false;
globalThis.__llmz_error = null;
globalThis.__llmz_error_stack = null;

(async () => {
  try {
    async function __fn__() {
${transformedCode}
    }

    globalThis.__llmz_result = await __fn__();
    globalThis.__llmz_result_set = true;
  } catch (err) {
    globalThis.__llmz_error = typeof err === 'string' ? err : String(err.message || err || '');
    globalThis.__llmz_error_name = typeof err?.name === 'string' ? err.name : 'Error';
    globalThis.__llmz_error_stack = '' + (err.stack || '');
  } finally {
    __llmz_program_complete();
  }
})();
`.trim()
}

function describeAbortReason(reason: unknown): string {
  if (reason instanceof Error) {
    return `${reason.name}: ${reason.message}`
  }

  return reason ? String(reason) : 'Execution was aborted'
}
