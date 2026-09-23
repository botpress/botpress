import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createJoinedAbortController, createJoinedAbortSignal } from './abort-signal.js'

describe('createJoinedAbortController', () => {
  let controllers: AbortController[]

  beforeEach(() => {
    controllers = []
  })

  afterEach(() => {
    // Clean up all controllers
    controllers.forEach((controller) => {
      if (!controller.signal.aborted) {
        controller.abort()
      }
    })
  })

  const createController = (): AbortController => {
    const controller = new AbortController()
    controllers.push(controller)
    return controller
  }

  describe('basic functionality', () => {
    it('creates a controller that aborts when any input signal aborts', () => {
      const controller1 = createController()
      const controller2 = createController()
      const joinedController = createJoinedAbortController([controller1.signal, controller2.signal])

      expect(joinedController.signal.aborted).toBe(false)

      controller1.abort('first signal aborted')

      expect(joinedController.signal.aborted).toBe(true)
      expect(joinedController.signal.reason).toBe('first signal aborted')
    })

    it('aborts with the reason from the triggering signal', () => {
      const controller1 = createController()
      const controller2 = createController()
      const joinedController = createJoinedAbortController([controller1.signal, controller2.signal])

      controller2.abort('second signal reason')

      expect(joinedController.signal.aborted).toBe(true)
      expect(joinedController.signal.reason).toBe('second signal reason')
    })

    it('works with a single signal', () => {
      const controller = createController()
      const joinedController = createJoinedAbortController([controller.signal])

      expect(joinedController.signal.aborted).toBe(false)

      controller.abort('single signal')

      expect(joinedController.signal.aborted).toBe(true)
      expect(joinedController.signal.reason).toBe('single signal')
    })

    it('handles already aborted signals', () => {
      const controller1 = createController()
      const controller2 = createController()

      controller1.abort('already aborted')

      const joinedController = createJoinedAbortController([controller1.signal, controller2.signal])

      expect(joinedController.signal.aborted).toBe(true)
      expect(joinedController.signal.reason).toBe('already aborted')
    })
  })

  describe('edge cases', () => {
    it('handles empty array', () => {
      const joinedController = createJoinedAbortController([])

      expect(joinedController.signal.aborted).toBe(false)

      // Should be able to abort manually
      joinedController.abort('manual abort')
      expect(joinedController.signal.aborted).toBe(true)
      expect(joinedController.signal.reason).toBe('manual abort')
    })

    it('filters out null and undefined signals', () => {
      const controller = createController()
      const joinedController = createJoinedAbortController([null, controller.signal, undefined])

      expect(joinedController.signal.aborted).toBe(false)

      controller.abort('valid signal')

      expect(joinedController.signal.aborted).toBe(true)
      expect(joinedController.signal.reason).toBe('valid signal')
    })

    it('handles array with only null/undefined values', () => {
      const joinedController = createJoinedAbortController([null, undefined])

      expect(joinedController.signal.aborted).toBe(false)

      // Should work like empty array
      joinedController.abort('manual abort')
      expect(joinedController.signal.aborted).toBe(true)
    })
  })

  describe('event listener management and memory leak prevention', () => {
    it('removes event listeners when joined controller is aborted', () => {
      const controller1 = createController()
      const controller2 = createController()

      // Mock addEventListener and removeEventListener to track calls
      const originalAddEventListener = controller1.signal.addEventListener
      const originalRemoveEventListener = controller1.signal.removeEventListener
      const addEventListenerSpy1 = vi.spyOn(controller1.signal, 'addEventListener')
      const removeEventListenerSpy1 = vi.spyOn(controller1.signal, 'removeEventListener')
      const addEventListenerSpy2 = vi.spyOn(controller2.signal, 'addEventListener')
      const removeEventListenerSpy2 = vi.spyOn(controller2.signal, 'removeEventListener')

      const joinedController = createJoinedAbortController([controller1.signal, controller2.signal])

      // Should have added listeners to both signals
      expect(addEventListenerSpy1).toHaveBeenCalledWith('abort', expect.any(Function))
      expect(addEventListenerSpy2).toHaveBeenCalledWith('abort', expect.any(Function))

      // Abort one of the original signals
      controller1.abort('trigger cleanup')

      // Should have removed listeners from both signals
      expect(removeEventListenerSpy1).toHaveBeenCalledWith('abort', expect.any(Function))
      expect(removeEventListenerSpy2).toHaveBeenCalledWith('abort', expect.any(Function))

      // Restore original methods
      controller1.signal.addEventListener = originalAddEventListener
      controller1.signal.removeEventListener = originalRemoveEventListener
    })

    it('removes event listeners when joined controller is manually aborted', () => {
      const controller1 = createController()
      const controller2 = createController()

      const removeEventListenerSpy1 = vi.spyOn(controller1.signal, 'removeEventListener')
      const removeEventListenerSpy2 = vi.spyOn(controller2.signal, 'removeEventListener')

      const joinedController = createJoinedAbortController([controller1.signal, controller2.signal])

      // Manually abort the joined controller
      joinedController.abort('manual abort')

      expect(joinedController.signal.aborted).toBe(true)

      // Should have cleaned up listeners
      expect(removeEventListenerSpy1).toHaveBeenCalledWith('abort', expect.any(Function))
      expect(removeEventListenerSpy2).toHaveBeenCalledWith('abort', expect.any(Function))
    })

    it('does not leak listeners when input signal is already aborted', () => {
      const controller1 = createController()
      const controller2 = createController()

      // Abort one signal before joining
      controller1.abort('pre-aborted')

      const addEventListenerSpy1 = vi.spyOn(controller1.signal, 'addEventListener')
      const addEventListenerSpy2 = vi.spyOn(controller2.signal, 'addEventListener')

      const joinedController = createJoinedAbortController([controller1.signal, controller2.signal])

      // Should not add listeners since one signal was already aborted
      expect(addEventListenerSpy1).not.toHaveBeenCalled()
      expect(addEventListenerSpy2).not.toHaveBeenCalled()
      expect(joinedController.signal.aborted).toBe(true)
    })

    it('handles rapid successive aborts without memory leaks', () => {
      const signals: AbortSignal[] = []
      const controllers: AbortController[] = []

      // Create multiple controllers
      for (let i = 0; i < 10; i++) {
        const controller = createController()
        controllers.push(controller)
        signals.push(controller.signal)
      }

      const joinedController = createJoinedAbortController(signals)

      // Track cleanup calls
      const cleanupSpies = signals.map((signal) => vi.spyOn(signal, 'removeEventListener'))

      // Abort one signal to trigger cleanup
      controllers[5]?.abort('trigger cleanup')

      expect(joinedController.signal.aborted).toBe(true)

      // All signals should have had their listeners removed
      cleanupSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalledWith('abort', expect.any(Function))
      })
    })
  })

  describe('integration scenarios', () => {
    it('works correctly in nested scenarios', () => {
      const controller1 = createController()
      const controller2 = createController()
      const controller3 = createController()

      // Create a joined controller from first two
      const firstJoinedController = createJoinedAbortController([controller1.signal, controller2.signal])

      // Create another joined controller that includes the first joined signal and a third signal
      const secondJoinedController = createJoinedAbortController([firstJoinedController.signal, controller3.signal])

      expect(secondJoinedController.signal.aborted).toBe(false)

      // Abort the original controller1
      controller1.abort('nested abort')

      // Both joined controllers should be aborted
      expect(firstJoinedController.signal.aborted).toBe(true)
      expect(secondJoinedController.signal.aborted).toBe(true)
      expect(secondJoinedController.signal.reason).toBe('nested abort')
    })

    it('handles timeout scenarios', async () => {
      const controller = createController()
      const timeoutController = new AbortController()

      // Set up a timeout
      const timeoutId = setTimeout(() => {
        timeoutController.abort('timeout')
      }, 50)

      const joinedController = createJoinedAbortController([controller.signal, timeoutController.signal])

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(joinedController.signal.aborted).toBe(true)
      expect(joinedController.signal.reason).toBe('timeout')

      clearTimeout(timeoutId)
    })
  })
})

describe('createJoinedAbortSignal', () => {
  let controllers: AbortController[]

  beforeEach(() => {
    controllers = []
  })

  afterEach(() => {
    controllers.forEach((controller) => {
      if (!controller.signal.aborted) {
        controller.abort()
      }
    })
  })

  const createController = (): AbortController => {
    const controller = new AbortController()
    controllers.push(controller)
    return controller
  }

  it('returns a signal that aborts when any input signal aborts', () => {
    const controller1 = createController()
    const controller2 = createController()
    const joinedSignal = createJoinedAbortSignal([controller1.signal, controller2.signal])

    expect(joinedSignal.aborted).toBe(false)

    controller2.abort('convenience function test')

    expect(joinedSignal.aborted).toBe(true)
    expect(joinedSignal.reason).toBe('convenience function test')
  })

  it('works with empty array', () => {
    const joinedSignal = createJoinedAbortSignal([])

    expect(joinedSignal.aborted).toBe(false)
  })

  it('filters out null and undefined signals', () => {
    const controller = createController()
    const joinedSignal = createJoinedAbortSignal([null, controller.signal, undefined])

    expect(joinedSignal.aborted).toBe(false)

    controller.abort('filtered signal test')

    expect(joinedSignal.aborted).toBe(true)
    expect(joinedSignal.reason).toBe('filtered signal test')
  })
})
