import 'jest-extended'
import 'reflect-metadata'

import 'bluebird-global'

import { MiddlewareManager } from './middleware'

describe('Middleware', () => {
  const middleware = MiddlewareManager()

  it('should call middleware in order', async () => {
    const mock1 = jest.fn()
    const mock2 = jest.fn()
    middleware.use(mock1)
    middleware.use(mock2)

    await Promise.fromCallback(callback => middleware.run([], callback))
    expect(mock1).toHaveBeenCalledBefore(mock2)
  })

  it('should pass args to middleware', async () => {
    const args = ['anything']
    const mock = jest.fn()
    middleware.use(mock)

    await Promise.fromCallback(callback => middleware.run(args, callback))
    expect(mock).toHaveBeenCalledWith(args)
  })
})
