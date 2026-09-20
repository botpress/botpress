import { isEqual } from 'lodash-es'

import type { InspectionPolicyLookup } from '../inspect.js'
import { cloneMemoryValue, type MemoryValue } from '../memory.js'
import type { TruncationPolicy } from '../truncate.js'

type CapturedPolicy = {
  policy: TruncationPolicy
  explicit: boolean
}

type CapturedValue = CapturedPolicy & { value: MemoryValue }

/** Explicit display policies apply only to unchanged values in this JavaScript execution. */
export class InspectionValues {
  private readonly _primitives = new Map<Exclude<MemoryValue, object>, CapturedPolicy>()
  private readonly _objects = new Map<string, CapturedValue[]>()

  public capture(value: unknown, policy: TruncationPolicy): void {
    this._register(value, policy, true)
  }

  public captureDefault(value: unknown, maxTokens: number): void {
    this._register(value, { maxTokens, preserve: 'top' }, false)
  }

  private _register(value: unknown, policy: TruncationPolicy, explicit: boolean): void {
    let captured: MemoryValue

    try {
      captured = cloneMemoryValue(value)
    } catch {
      // Display metadata must not change whether the business call succeeds.
      return
    }

    if (!captured || typeof captured !== 'object') {
      const previous = this._primitives.get(captured)
      this._primitives.set(captured, this._mergePolicy(previous, { policy, explicit }))

      return
    }

    const key = this._objectKey(captured)
    const candidates = this._objects.get(key) ?? []
    const previous = candidates.find((candidate) => isEqual(candidate.value, captured))

    if (previous) {
      const selected = this._mergePolicy(previous, { policy, explicit })
      previous.policy = selected.policy
      previous.explicit = selected.explicit

      return
    }

    candidates.push({ value: captured, policy: { ...policy }, explicit })
    this._objects.set(key, candidates)
  }

  /** Match unchanged VM copies without rebuilding a wrapped display graph. */
  public readonly getPolicy: InspectionPolicyLookup = (value) => {
    if (!value || typeof value !== 'object') {
      return this._primitives.get(value as Exclude<MemoryValue, object>)?.policy
    }

    const candidates = this._objects.get(this._objectKey(value)) ?? []
    return candidates.find((candidate) => isEqual(candidate.value, value))?.policy
  }

  private _objectKey(value: object): string {
    return Array.isArray(value) ? `array:${value.length}` : `object:${Object.keys(value).length}`
  }

  private _mergePolicy(previous: CapturedPolicy | undefined, next: CapturedPolicy): CapturedPolicy {
    if (previous?.explicit && !next.explicit) {
      return previous
    }

    if (!previous || (!previous.explicit && next.explicit) || next.policy.maxTokens < previous.policy.maxTokens) {
      return { policy: { ...next.policy }, explicit: next.explicit }
    }

    if (next.policy.maxTokens === previous.policy.maxTokens && next.policy.preserve !== previous.policy.preserve) {
      return { policy: { maxTokens: next.policy.maxTokens, preserve: 'top' }, explicit: next.explicit }
    }

    return previous
  }
}
