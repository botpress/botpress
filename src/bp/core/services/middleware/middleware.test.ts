import 'bluebird-global'
import { IO } from 'botpress/sdk'
import 'jest-extended'
import 'reflect-metadata'

import { MiddlewareChain } from './middleware'

describe('Middleware', () => {
  let middleware: MiddlewareChain

  beforeEach(() => {
    middleware = new MiddlewareChain({ timeoutInMs: 5 })
  })

  it('should call middleware in order', async () => {
    const mock1 = jest.fn()
    const mock2 = jest.fn()

    const fn1 = (event, next) => {
      mock1(event)
      next()
    }

    const fn2 = (event, next) => {
      mock2(event)
      next()
    }

    middleware.use(fn1)
    middleware.use(fn2)

    await middleware.run({} as IO.Event)

    expect(mock1).toHaveBeenCalledBefore(mock2)
  })

  it('if middleware swallows the event, second is not called', async () => {
    const mock1 = jest.fn()
    const mock2 = jest.fn()

    const fn1 = (event, next) => {
      mock1(event)
      // next() We swallow the event
    }

    middleware.use(fn1)
    middleware.use(mock2)

    const event = {} as IO.Event
    await middleware.run(event)

    expect(mock1).toHaveBeenCalled()
    expect(mock2).not.toHaveBeenCalled()
  })

  it('should pass event to middleware', async () => {
    const mock = jest.fn()

    middleware.use(event => {
      mock(event)
    })

    const event = {} as IO.Event
    await middleware.run(event)
    expect(mock).toHaveBeenCalledWith(event)
  })

  it('if mw throws, the chain throws the error', async () => {
    const err = new Error('lol')

    middleware.use(event => {
      throw err
    })

    expect(middleware.run({} as IO.Event)).rejects.toEqual(err)
  })
})
