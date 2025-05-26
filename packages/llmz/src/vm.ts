import { type Isolate } from 'isolated-vm'
import { isFunction, mapValues, maxBy } from 'lodash-es'
import { SourceMapConsumer } from 'source-map-js'

import { compile, CompiledCode, Identifiers } from './compiler/index.js'
import { AssignmentError, CodeExecutionError, InvalidCodeError, Signals, SnapshotSignal, VMSignal } from './errors.js'
import { createJsxComponent, JsxComponent } from './jsx.js'
import { cleanStackTrace } from './stack-traces.js'
import { Trace, Traces, VMExecutionResult } from './types.js'

// We do this because we want it to work in the browser
const IS_NODE = typeof process !== 'undefined' && process.versions != null && process.versions.node != null
const IS_CI = !!process.env.CI
const VM_DRIVER = process.env.VM_DRIVER ?? (IS_CI ? 'node' : 'isolated-vm')
export const USE_ISOLATED_VM = IS_NODE && VM_DRIVER === 'isolated-vm'
const LINE_OFFSET = USE_ISOLATED_VM ? 3 : 1

const MAX_VM_EXECUTION_TIME = 60_000

const requireEsm = async (id: string) => {
  // @ts-ignore
  if (typeof globalThis.window === 'undefined' && typeof globalThis.require !== 'undefined') {
    // Node environment: use eval to bypass bundler detection
    // eslint-disable
    return eval('require')(id)
  } else {
    // Browser environment
    return await import(id).then((m) => m.default ?? m)
  }
}

// We do this because we want it to work in the browser and isolated-vm is only used when running in NodeJS

const getIsolatedVm = async () => (await requireEsm('isolated-vm')) as typeof import('isolated-vm')

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

// TODO: use debug() to log what's going on, remove console.log and also log which driver is being used

export async function runAsyncFunction(
  context: any,
  code: string,
  traces: Trace[] = [],
  signal: AbortSignal | null = null
): Promise<VMExecutionResult> {
  const transformed = getCompiledCode(code, traces)
  const lines_executed = new Map<number, number>()
  const variables: { [k: string]: () => any } = {}

  const consumer = new SourceMapConsumer({
    version: transformed.map!.version.toString(),
    mappings: transformed.map!.mappings,
    names: transformed.map!.names!,
    sources: [transformed.map!.file!],
    sourcesContent: [transformed.code!],
    file: transformed.map!.file!,
    sourceRoot: transformed.map!.sourceRoot!,
  })

  // TODO: we should throw an error if the context is not a plain object (unless it's null or undefined)
  context ??= {}

  for (const name of transformed.variables) {
    // TODO: warn here as we're overwriting the context
    delete context[name]
  }

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

  if (!USE_ISOLATED_VM) {
    const AsyncFunction: (...args: unknown[]) => (...args: unknown[]) => AsyncGenerator<JsxComponent> =
      async function* () {}.constructor as any

    return await (async () => {
      const topLevelProperties = Object.keys(context).filter(
        (x) => !NO_TRACKING.includes(x) && typeof context[x] !== 'function' && typeof context[x] !== 'object'
      )

      const __report = (name: string, value: unknown) => {
        context[name] = value
      }

      context.__report = __report

      const reportAll = topLevelProperties.map((x) => `__report("${x}", ${x})`).join(';')

      // we're wrapping the function creation inside a promise closure to catch sync errors in the promise catch clause below
      const wrapper = `"use strict"; try { ${transformed.code} } finally { ${reportAll} };`

      const fn = AsyncFunction(...Object.keys(context), wrapper)
      const res = fn(...Object.values(context))

      do {
        const { value, done } = await res.next()
        if (done) {
          return value
        }
        await context[Identifiers.AsyncIterYieldFnIdentifier](value)
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
      .catch((err) => handleError(err, code, consumer, traces, variables, lines_executed, currentToolCall))
      .catch((err) => handleCatch(err, traces, variables, lines_executed))
  }

  const isolatedVm = await getIsolatedVm()
  const isolate: Isolate = new isolatedVm.Isolate({ memoryLimit: 128 })
  const isolatedContext = await isolate.createContext()
  const jail = isolatedContext.global
  const trackedProperties = new Set<string>()

  const abort = () => {
    if (USE_ISOLATED_VM) {
      isolate.dispose()
      isolatedContext.release()
    }
  }

  if (signal) {
    signal.addEventListener('abort', abort)
  }

  await jail.set('global', jail.derefInto())

  for (const key of Object.keys(context)) {
    // Re-hydrate functions on Objects
    // Arguments to the function are copied (copy: true), so function arguments need to be Transferable
    // The result of is copied back using ExternalCopy, so the return value of the function needs to be Transferable as well

    if (typeof context[key] === 'function') {
      await isolatedContext.evalClosure(
        `global['${key}'] = (...args) => $0.applySyncPromise(null, args, {arguments: {copy: true}});`,
        [async (...args: any[]) => new isolatedVm.ExternalCopy(await context[key](...args)).copyInto()],
        {
          arguments: { reference: true },
        }
      )
    } else if (typeof context[key] === 'object') {
      // TODO: this should be recursive, so we can copy objects with nested objects and functions
      try {
        trackedProperties.add(key)
        const initial = Array.isArray(context[key]) ? new Array(context[key].length) : {}
        await jail.set(key, initial, { copy: true })
        const props = new Set([...Object.keys(context[key]), ...Object.getOwnPropertyNames(context[key])])

        for (const prop of props) {
          try {
            if (typeof context[key][prop] === 'function') {
              await isolatedContext.evalClosure(
                `global['${key}']['${prop}'] = (...args) => $0.applySyncPromise(null, args, {arguments: {copy: true}});`,
                [async (...args: any[]) => new isolatedVm.ExternalCopy(await context[key][prop](...args)).copyInto()],
                {
                  arguments: { reference: true },
                }
              )
            } else {
              await isolatedContext.evalClosure(`global['${key}']['${prop}'] = $0;`, [context[key][prop]], {
                arguments: { copy: true },
              })
            }
          } catch (err) {
            console.error(`Could not copy "${key}.${prop}" (typeof = ${typeof context[key][prop]}) to the sandbox`, err)
          }
        }
      } catch (err) {
        console.error(`Could not create object "${key}" (typeof = ${typeof context[key]}) in the sandbox`, err)
      }
    } else {
      try {
        await jail.set(key, context[key], { copy: true })
        trackedProperties.add(key)
      } catch (err) {
        console.error(`Could not copy "${key}" to the sandbox (typeof = ${typeof context[key]})`, err)
      }
    }
  }

  for (const key of Object.keys(context)) {
    if (Object.isSealed(context[key])) {
      await isolatedContext.evalClosure(`Object.seal(global['${key}']);`, [])
    }

    if (!Object.isExtensible(context[key])) {
      await isolatedContext.evalClosure(`Object.preventExtensions(global['${key}']);`, [])
    }
  }

  // LLMz-specific Objects
  // Seal back the objects that were sealed (such as LLMz namespaces and objects)
  // This is used to throw when trying to assign new properties or change readonly variables

  const Console = await jail.get(Identifiers.ConsoleObjIdentifier, { reference: true })
  await Console.set('log', (...args: any[]) => {
    const message = args.shift()
    traces.push({ type: 'log', message, args, started_at: Date.now() })
  })

  await isolatedContext.evalClosure(
    `${Identifiers.VariableTrackingFnIdentifier} = (name, getter) => {
        const value = getter();
        try {
          $0.applySync(null, [name, getter()], { arguments: { copy: true } });
        } catch {
          $0.applySync(null, [name, '[[non-primitive]]'], { arguments: { copy: true } });
        }
      };`,

    [
      (name: string, value: any) => {
        variables[name] = value
      },
    ],
    {
      arguments: { reference: true },
    }
  )

  const scriptCode = `
"use strict";
new Promise(async (resolve) => {

async function* __fn__() {
${transformed.code}
}

const fn = __fn__();
do {
  const { value, done } = await fn.next();
  if (done) {
    const ret = await value;
    return resolve(ret);
  }
  await ${Identifiers.AsyncIterYieldFnIdentifier}(value);
} while(true);

})`.trim()

  const script = await isolate.compileScript(scriptCode, { filename: '<isolated-vm>', columnOffset: 0, lineOffset: 0 })

  const copyErrors: Error[] = []
  let copied = false

  const copyBackContextFromJail = () => {
    if (copied) {
      return
    }
    copied = true

    for (const key of trackedProperties) {
      if (typeof context[key] === 'object') {
        try {
          let properties: string[] = []

          try {
            properties =
              isolatedContext.evalClosureSync(`return Object.getOwnPropertyNames(global['${key}'])`, [], {
                result: { copy: true },
              }) ?? []
          } catch (err) {
            console.error(`Could not get properties of object "${key}" from the sandbox`, err)
          }

          const propsToDelete = Object.getOwnPropertyNames(context[key]).filter((x) => !properties.includes(x))

          for (const prop of propsToDelete) {
            delete context[key][prop]
          }

          for (const prop of properties) {
            if (typeof context[key][prop] === 'function') {
              // We don't copy back known functions, as they are already defined in the context and they can't be copied back from the VM
              continue
            }

            try {
              // TODO: ideally we would do this recursively, so we can copy objects with nested objects and functions
              const obj = isolatedContext.evalClosureSync(`return global['${key}']['${prop}']`, [], {
                result: { copy: true },
              })
              try {
                Object.assign(context[key], { [prop]: obj })
              } catch (err) {
                if (err instanceof AssignmentError) {
                  traces.push({
                    type: 'code_execution_exception',
                    position: [0, 0],
                    message: err.message,
                    stackTrace: '',
                    started_at: Date.now(),
                    ended_at: Date.now(),
                  })
                  copyErrors.push(err)
                }
                // if the variable is read-only, we can't assign to it
                // this is OK, we don't want to log this
              }
            } catch (err) {
              console.error(`Could not copy back "${key}.${prop}" from the sandbox`, err)
            }
          }
        } catch (err) {
          console.error(`Could not copy back object "${key}" from the sandbox`, err)
        }
      } else {
        try {
          const value = jail.getSync(key, { copy: true })
          try {
            Object.assign(context, { [key]: value })
          } catch (err) {
            if (err instanceof AssignmentError) {
              traces.push({
                type: 'code_execution_exception',
                position: [0, 0],
                message: err.message,
                stackTrace: '',
                started_at: Date.now(),
                ended_at: Date.now(),
              })
              copyErrors.push(err)
            }
            // if the variable is read-only, we can't assign to it
            // this is OK, we don't want to log this
          }
        } catch (err) {
          console.error(`Could not copy back "${key}" from the sandbox`, err)
        }
      }
    }
  }

  const final = await script
    .run(isolatedContext, {
      // TODO: fix getRemainingTimeInMillis ...
      // TODO: probably expose a "timeout" option instead
      // timeout: clamp(Runtime.getRemainingTimeInMillis() - 10_000, 5_000, MAX_VM_EXECUTION_TIME),
      timeout: MAX_VM_EXECUTION_TIME,
      copy: true,
      promise: true,
    })
    .then((res) => {
      copyBackContextFromJail()
      if (copyErrors.length) {
        throw new CodeExecutionError(copyErrors.map((x) => x.message).join(', '), code, '')
      }
      return res
    })
    .then(
      (res) => {
        res = Signals.maybeDeserializeError(res)

        return {
          success: true,
          variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
          signal: res instanceof VMSignal ? res : undefined,
          lines_executed: Array.from(lines_executed),
          return_value: res,
        } satisfies VMExecutionResult
      },
      (err) => {
        return handleError(err, code, consumer, traces, variables, lines_executed, currentToolCall)
      }
    )
    .catch((err) => {
      if (signal?.aborted) {
        return handleCatch(new Error('Execution was aborted'), traces, variables, lines_executed)
      } else {
        copyBackContextFromJail() // Copy back even when there's an error in the middle of the execution
      }

      return handleCatch(err, traces, variables, lines_executed)
    })

  signal?.removeEventListener('abort', abort)

  try {
    isolate.dispose()
  } catch {}

  try {
    isolatedContext.release()
  } catch {}

  return final
}

const handleError = (
  err: Error,
  code: string,
  consumer: SourceMapConsumer,
  traces: Traces.Trace[],
  variables: { [k: string]: () => any },
  // @ts-ignore
  lines_executed: Map<number, number>,
  /**
   * The current tool call that the error is associated with
   */
  currentToolCall?: SnapshotSignal['toolCall'] | undefined
) => {
  err = Signals.maybeDeserializeError(err)
  const lines = code.split('\n')
  const stackTrace = err.stack || ''

  let regex = /\(<isolated-vm>:(\d+):(\d+)/g
  // at __fn__ (<isolated-vm>:13:269)
  //           ~~~~~~~~~~~~~~~~~~~~~~

  if (!USE_ISOLATED_VM) {
    regex = /<anonymous>:(\d+):(\d+)/g
    // <anonymous>:13:269)
    // ~~~~~~~~~~~~~~~~~~
  }

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
    const VM_OFFSET = USE_ISOLATED_VM ? 2 : 2
    const DISPLAY_OFFSET = USE_ISOLATED_VM ? 2 : 0
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
