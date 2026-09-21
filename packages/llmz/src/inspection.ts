import { inspect, limitInspectionOutput, resolveInspectionBudget, type InspectionPolicyLookup } from './inspect.js'
import { isTruncated, type TruncatePreserve } from './truncate.js'

export type InspectionPurpose =
  | 'result'
  | 'variable'
  | 'property'
  | 'tool-input'
  | 'tool-output'
  | 'message'
  | 'error'
  | 'code'
  | 'event'
  | 'name'

export type InspectionIdentity = {
  sessionId?: string
  turn?: number
  turnId?: string
  iteration?: number
  iterationId?: string
  variable?: string
  object?: string
  property?: string
  tool?: string
  component?: string
  name?: string
}

export type InspectEvent = {
  /** An isolated, read-only copy. Changing a preview never changes runtime memory. */
  readonly value: unknown
  readonly purpose: InspectionPurpose
  readonly maxTokens: number
  readonly preserve: TruncatePreserve
  readonly compact: boolean
  readonly identity?: Readonly<InspectionIdentity>
}

/** Return undefined to use LLMz's default formatter. Returned text remains token-bounded. */
export type OnInspect = (event: InspectEvent) => string | undefined

export type InspectionOptions = {
  purpose: InspectionPurpose
  maxTokens: number
  preserve?: TruncatePreserve
  compact?: boolean
  identity?: InspectionIdentity
  policies?: InspectionPolicyLookup
}

export type Inspector = (value: unknown, options: InspectionOptions) => string

/** The shared boundary for values displayed in prompts, reports, and memory inventories. */
export function createInspector(onInspect?: OnInspect): Inspector {
  return (value, options) => {
    const formatting = {
      tokens: options.maxTokens,
      preserve: options.preserve,
      compact: options.compact ?? false,
      honorTruncation: options.purpose === 'result',
      policies: options.policies,
      maxStringLength: Infinity,
    }

    if (onInspect) {
      try {
        const budget = resolveInspectionBudget(value, formatting)
        const output = onInspect(
          Object.freeze({
            value: snapshot(value),
            purpose: options.purpose,
            maxTokens: budget.tokens,
            preserve: budget.preserve,
            compact: formatting.compact,
            identity: options.identity ? Object.freeze({ ...options.identity }) : undefined,
          })
        )

        if (typeof output === 'string') {
          return limitInspectionOutput(output, budget.tokens, false, budget.preserve)
        }
      } catch {
        // A display hook must not turn completed business operations into failures.
      }
    }

    return inspect(value, undefined, formatting)
  }
}

function snapshot(value: unknown, copies = new WeakMap<object, unknown>()): unknown {
  if (!value || typeof value !== 'object') {
    return typeof value === 'function' ? '[Function]' : value
  }

  if (copies.has(value)) {
    return copies.get(value)
  }

  if (isTruncated(value)) {
    // Display metadata is delivered through the event, never as user data.
    copies.set(value, '[Circular]')
    const copy = snapshot(value.value, copies)
    copies.set(value, copy)
    return copy
  }

  if (value instanceof Date) {
    return Object.freeze(new Date(Date.prototype.getTime.call(value)))
  }

  const copy = Array.isArray(value) ? new Array(value.length) : Object.create(null)
  copies.set(value, copy)

  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === 'length') {
      continue
    }

    const descriptor = Object.getOwnPropertyDescriptor(value, key)

    if (descriptor) {
      Object.defineProperty(copy, key, {
        value: 'value' in descriptor ? snapshot(descriptor.value, copies) : '[Getter]',
        enumerable: descriptor.enumerable,
      })
    }
  }

  return Object.freeze(copy)
}
