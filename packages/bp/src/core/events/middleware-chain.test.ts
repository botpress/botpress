import 'bluebird-global'
import { EventDirection, IO } from 'botpress/sdk'
import { createSpyObject, MockObject } from 'core/misc/utils'
import 'jest-extended'
import 'reflect-metadata'

import { MiddlewareChain } from './middleware-chain'
import { StepScopes, StepStatus } from './utils'

const base = { description: 'test', order: 1, direction: <EventDirection>'incoming' }
const defaultTimeout = 5

describe('Middleware', () => {
  let middleware: MiddlewareChain
  let event: MockObject<IO.Event>

  beforeEach(() => {
    middleware = new MiddlewareChain({ timeoutInMs: defaultTimeout })
    event = createSpyObject<IO.Event>()
  })

  afterEach(async () => {
    // Makes sure the timeout promise has time to finish
    await Promise.delay(defaultTimeout)
  })

  it('should call middleware in order', async () => {
    const mock1 = jest.fn()
    const mock2 = jest.fn()

    const fn1 = (event: IO.Event, next: IO.MiddlewareNextCallback) => {
      mock1(event)
      next()
    }

    const fn2 = (event: IO.Event, next: IO.MiddlewareNextCallback) => {
      mock2(event)
      next()
    }

    middleware.use({ handler: fn1, name: 'fn1', ...base })
    middleware.use({ handler: fn2, name: 'fn2', ...base })

    await middleware.run(event.T)

    expect(mock1).toHaveBeenCalledBefore(mock2)
  })

  it('if middleware swallows the event, second is not called', async () => {
    const mock1 = jest.fn()
    const mock2 = jest.fn()

    const fn1 = (event: IO.Event, next: IO.MiddlewareNextCallback) => {
      mock1(event)
      next(undefined, true) // We swallow the event
    }

    middleware.use({ handler: fn1, name: 'fn1', ...base })
    middleware.use({ handler: mock2, name: 'mock2', ...base })

    await middleware.run(event.T)

    expect(mock1).toHaveBeenCalled()
    expect(mock2).not.toHaveBeenCalled()
  })

  it('if middleware mark event as skipped, it should mark it on the event collector', async () => {
    const mock1 = jest.fn()
    const mock2 = jest.fn()

    const fn1 = (event: IO.Event, next: IO.MiddlewareNextCallback) => {
      mock1(event)
      next(undefined, false, true) // Mark the first mw as skipped
    }

    middleware.use({ handler: fn1, name: 'fn1', ...base })
    middleware.use({ handler: mock2, name: 'mock2', ...base })

    await middleware.run(event.T)

    expect(mock1).toHaveBeenCalled()
    expect(mock2).toHaveBeenCalled()
    expect(event.processing).toContainKey('mw:fn1:skipped')
    expect(event.processing).toContainKey('mw:mock2:timedOut')
  })

  it('should pass event to middleware', async () => {
    const mock = jest.fn()

    middleware.use({
      handler: (event, cb) => {
        mock(event)
        cb(undefined, true)
      },
      name: 'event',
      ...base
    })

    await middleware.run(event.T)
    expect(mock).toHaveBeenCalled()
  })

  it('if mw throws, the chain throws the error', async () => {
    const err = new Error('lol')

    middleware.use({
      handler: _event => {
        throw err
      },
      name: 'throw',
      ...base
    })

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(middleware.run({} as IO.Event)).rejects.toEqual(err)
  })

  it('if should set the timed out processing step on the event if the mw hits the timeout limit', async () => {
    const extraTime = 10
    const mock = jest.fn(async (_event: IO.Event) => {
      await Promise.delay(defaultTimeout + extraTime)
    })

    const mw = {
      handler: async (event: IO.Event, cb: IO.MiddlewareNextCallback) => {
        await mock(event)
        cb(undefined, true)
      },
      name: 'event',
      ...base
    }
    const processingKey = `${StepScopes.Middleware}:${mw.name}:${StepStatus.TimedOut}`

    middleware.use(mw)

    await middleware.run(event.T)
    expect(mock).toHaveBeenCalled()
    expect(event.processing![processingKey]).not.toBeUndefined()

    // make sure the promise has time to finish
    await Promise.delay(extraTime)
  })

  it('should let mw set a custom timeout value', async () => {
    // Avoid a small number, bluebird overhead sometimes makes the test fail
    const extraTime = 50
    const mock = jest.fn(async (_event: IO.Event) => {
      await Promise.delay(defaultTimeout + extraTime)
    })

    const mw = {
      handler: async (event: IO.Event, cb: IO.MiddlewareNextCallback) => {
        await mock(event)
        cb(undefined, true)
      },
      name: 'event',
      timeout: `${defaultTimeout + extraTime * 2}ms`,
      ...base
    }
    const timedOutProcessingKey = `${StepScopes.Middleware}:${mw.name}:${StepStatus.TimedOut}`
    const swallowedProcessingKey = `${StepScopes.Middleware}:${mw.name}:${StepStatus.Swallowed}`

    middleware.use(mw)

    await middleware.run(event.T)
    expect(mock).toHaveBeenCalled()
    expect(event.processing![timedOutProcessingKey]).toBeUndefined()
    expect(event.processing![swallowedProcessingKey]).not.toBeUndefined()

    // make sure the promise has time to finish
    await Promise.delay(extraTime)
  })
})
