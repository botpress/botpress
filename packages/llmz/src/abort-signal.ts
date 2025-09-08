/**
 * Creates a new AbortController that aborts when any of the provided signals abort.
 * This is useful for combining multiple abort conditions (e.g., user cancellation, timeout, parent operation abort).
 *
 * @param signals - Array of AbortSignals to listen to. Undefined/null signals are ignored.
 * @returns A new AbortController that will abort if any input signal aborts
 *
 * @example
 * ```typescript
 * const userController = new AbortController()
 * const timeoutController = new AbortController()
 *
 * // Create a joined controller that aborts if either signal aborts
 * const joinedController = createJoinedAbortController([
 *   userController.signal,
 *   timeoutController.signal
 * ])
 *
 * // Use the joined signal in operations
 * await fetch('/api/data', { signal: joinedController.signal })
 * ```
 */
export function createJoinedAbortController(signals: (AbortSignal | undefined | null)[]): AbortController {
  const controller = new AbortController()

  // Filter out undefined/null signals
  const validSignals = signals.filter((signal): signal is AbortSignal => signal != null)

  // If no valid signals provided, return the controller as-is
  if (validSignals.length === 0) {
    return controller
  }

  // Check if any signal is already aborted
  for (const signal of validSignals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller
    }
  }

  // Set up listeners for each signal
  const abortListeners: (() => void)[] = []

  for (const signal of validSignals) {
    const listener = () => {
      // Abort with the same reason as the triggering signal
      controller.abort(signal.reason)

      // Clean up all listeners to prevent memory leaks
      cleanup()
    }

    signal.addEventListener('abort', listener)
    abortListeners.push(() => signal.removeEventListener('abort', listener))
  }

  const cleanup = () => {
    abortListeners.forEach((removeListener) => removeListener())
  }

  // Clean up listeners when the joined controller is aborted
  // (this handles the case where controller.abort() is called directly)
  controller.signal.addEventListener('abort', cleanup, { once: true })

  return controller
}

/**
 * Convenience function that creates a joined abort signal directly.
 *
 * @param signals - Array of AbortSignals to combine
 * @returns The signal from the joined AbortController
 *
 * @example
 * ```typescript
 * const joinedSignal = createJoinedAbortSignal([
 *   userController.signal,
 *   timeoutController.signal
 * ])
 *
 * await someOperation({ signal: joinedSignal })
 * ```
 */
export function createJoinedAbortSignal(signals: (AbortSignal | undefined | null)[]): AbortSignal {
  return createJoinedAbortController(signals).signal
}
