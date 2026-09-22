import { HookError, isLLMzError, VMSignal } from '../errors.js'

/** Hooks may reject an iteration to request a correction; explicit critical errors still stop execution. */
export async function callHook<T>(callback: () => T | Promise<T>): Promise<T> {
  try {
    return await callback()
  } catch (cause) {
    if (isLLMzError(cause) || VMSignal.is(cause)) {
      throw cause
    }

    throw new HookError(cause instanceof Error ? cause.message : String(cause), { cause })
  }
}
