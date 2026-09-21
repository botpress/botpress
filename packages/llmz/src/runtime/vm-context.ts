import { z } from '@bpinternal/zui'

import { Context, Iteration } from '../context.js'
import { AssignmentError, ObjectPropertyError, UnknownToolError, type LLMzFailure } from '../errors.js'
import { parseSchemaSync } from '../schema.js'

import { cloneMemoryValue } from '../session/memory.js'
import type { TruncationPolicy } from '../truncate.js'
import { schemaToTypeScript } from '../typings.js'
import { stripInvalidIdentifiers } from '../utils.js'
import { withMissingMember } from '../vm/member-proxy.js'
import { VM_ON_ERROR, VM_PROGRAM_COMPLETE, VM_TERMINATION, type VMContext } from '../vm/types.js'
import type { JavaScriptApi } from './javascript-api.js'
import { wrapTool } from './tool-wrapper.js'
import { ExecutionHooks } from './types.js'

type BuildVMContextProps = {
  ctx: Context
  iteration: Iteration
  controller: AbortController
  onBeforeTool?: ExecutionHooks['onBeforeTool']
  onAfterTool?: ExecutionHooks['onAfterTool']
  onTruncation?: (value: unknown, policy: TruncationPolicy) => void
  onToolResult?: (value: unknown) => void
  javascriptApi?: JavaScriptApi
}

export const buildVMContext = ({
  ctx,
  iteration,
  controller,
  onBeforeTool,
  onAfterTool,
  onTruncation,
  onToolResult,
  javascriptApi,
}: BuildVMContextProps): VMContext => {
  const memoryBindings = ctx.session.getBindings()
  const vmContext: VMContext = {
    ...stripInvalidIdentifiers(memoryBindings),
    [VM_ON_ERROR]: (error) => {
      iteration.recordError(error)
    },
  }
  const reject = (error: LLMzFailure): never => {
    iteration.recordError(error)
    javascriptApi?.reportError(error)
    throw error
  }

  for (const name of ['$return', '$iterations']) {
    Object.defineProperty(vmContext, name, {
      value: memoryBindings[name],
      enumerable: true,
      writable: false,
      configurable: false,
    })
  }

  if (javascriptApi) {
    for (const [name, value] of Object.entries(javascriptApi.bindings)) {
      Object.defineProperty(vmContext, name, {
        value,
        enumerable: true,
        writable: false,
        configurable: false,
      })
    }

    Object.defineProperty(vmContext, VM_PROGRAM_COMPLETE, {
      value: javascriptApi.complete,
    })

    Object.defineProperty(vmContext, VM_TERMINATION, {
      value: {
        isTerminated: () =>
          javascriptApi.getTerminalOutcome() !== undefined || javascriptApi.getInterruption() !== undefined,
        check: javascriptApi.throwIfTerminated,
        getSignal: javascriptApi.getInterruption,
      },
    })
  }

  for (const obj of iteration.objects) {
    const internalValues: Record<string, any> = {}
    const instance: Record<string, any> = {}

    for (const { name, writable, type } of obj.properties ?? []) {
      const initialValue = ctx.session.memory.getObjectPropertyValue(obj.name, name)
      internalValues[name] = freezePropertyValue(initialValue)
      const schema = (type ?? z.any()) as z.ZodType

      Object.defineProperty(instance, name, {
        enumerable: true,
        configurable: true,
        get() {
          return internalValues[name]
        },
        set(value) {
          javascriptApi?.assertOpen()

          if (!writable) {
            reject(new AssignmentError(`Property ${obj.name}.${name} is read-only and cannot be modified`))
          }

          let parsed: ReturnType<typeof parseSchemaSync>
          try {
            parsed = parseSchemaSync(schema, value, `Object property ${obj.name}.${name}`)
          } catch (error) {
            const failure = iteration.recordError(error)
            javascriptApi?.reportError(failure)
            throw failure
          }

          if (!parsed.success) {
            reject(new ObjectPropertyError(obj.name, name, parsed.error.issues, schemaToTypeScript(schema)))
          }

          internalValues[name] = freezePropertyValue(cloneMemoryValue(parsed.data))

          iteration.recordTrace({
            type: 'property',
            started_at: Date.now(),
            object: obj.name,
            property: name,
            value: parsed.data,
          })

          iteration.trackMutation({ object: obj.name, property: name, before: initialValue, after: parsed.data })
        },
      })
    }

    for (const tool of obj.tools ?? []) {
      const wrapped = wrapTool({
        tool,
        object: obj.name,
        iteration,
        beforeHook: onBeforeTool,
        afterHook: onAfterTool,
        onTruncation,
        onResult: onToolResult,
        controller,
      })
      instance[tool.name] = javascriptApi ? (input: unknown) => javascriptApi.track(() => wrapped(input)) : wrapped
    }

    vmContext[obj.name] = withMissingMember(instance, (name) => {
      const error = new UnknownToolError(
        `${obj.name}.${name}`,
        (obj.tools ?? []).map((tool) => `${obj.name}.${tool.name}`)
      )
      iteration.recordError(error)
      throw error
    })
  }

  for (const tool of iteration.tools) {
    const wrapped = wrapTool({
      tool,
      iteration,
      beforeHook: onBeforeTool,
      afterHook: onAfterTool,
      onTruncation,
      onResult: onToolResult,
      controller,
    })
    const callable = javascriptApi ? (input: unknown) => javascriptApi.track(() => wrapped(input)) : wrapped

    for (const key of [tool.name, ...(tool.aliases ?? [])]) {
      vmContext[key] = callable
    }
  }

  return vmContext
}

/** Nested edits must go through whole-property assignment so its schema always runs. */
function freezePropertyValue<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) {
      freezePropertyValue(child)
    }

    Object.freeze(value)
  }

  return value
}
