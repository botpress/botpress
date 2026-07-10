import { z } from '@bpinternal/zui'
import { isEqual } from 'lodash-es'

import { Context, Iteration } from '../context.js'
import { AssignmentError } from '../errors.js'
import { type Trace } from '../types.js'
import { getErrorMessage, stripInvalidIdentifiers } from '../utils.js'
import { type VMContext } from '../vm/types.js'
import { wrapTool } from './tool-wrapper.js'
import { ExecutionHooks } from './types.js'

type BuildVMContextProps = {
  ctx: Context
  iteration: Iteration
  controller: AbortController
  onBeforeTool?: ExecutionHooks['onBeforeTool']
  onAfterTool?: ExecutionHooks['onAfterTool']
}

export const buildVMContext = ({
  ctx,
  iteration,
  controller,
  onBeforeTool,
  onAfterTool,
}: BuildVMContextProps): VMContext => {
  const traces: Trace[] = iteration.traces
  const vmContext = { ...stripInvalidIdentifiers(iteration.variables) }

  for (const obj of iteration.objects) {
    const internalValues: Record<string, any> = {}
    const instance: Record<string, any> = {}

    for (const { name, value, writable, type } of obj.properties ?? []) {
      internalValues[name] = value

      const initialValue = value
      const schema = (type ?? z.any()) as z.ZodType

      Object.defineProperty(instance, name, {
        enumerable: true,
        configurable: true,
        get() {
          return internalValues[name]
        },
        set(value) {
          if (isEqual(value, internalValues[name])) {
            return
          }

          if (!writable) {
            throw new AssignmentError(`Property ${obj.name}.${name} is read-only and cannot be modified`)
          }

          const parsed = schema.safeParse(value)

          if (!parsed.success) {
            throw new AssignmentError(
              `Invalid value for Object property ${obj.name}.${name}: ${getErrorMessage(parsed.error)}`
            )
          }

          internalValues[name] = parsed.data

          traces.push({
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
      instance[tool.name] = wrapTool({
        chat: ctx.chat,
        tool,
        traces,
        object: obj.name,
        iteration,
        beforeHook: onBeforeTool,
        afterHook: onAfterTool,
        controller,
      })
    }

    Object.preventExtensions(instance)
    Object.seal(instance)

    vmContext[obj.name] = instance
  }

  for (const tool of iteration.tools) {
    const wrapped = wrapTool({
      chat: ctx.chat,
      tool,
      traces,
      iteration,
      beforeHook: onBeforeTool,
      afterHook: onAfterTool,
      controller,
    })
    for (const key of [tool.name, ...(tool.aliases ?? [])]) {
      vmContext[key] = wrapped
    }
  }

  return vmContext
}
