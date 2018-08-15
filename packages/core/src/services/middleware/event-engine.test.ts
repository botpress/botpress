import 'jest-extended'
import 'reflect-metadata'

import { ScoppedEventEngine } from './event-engine'

const mockLogger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }

describe('EventEngine', () => {
  const engine = new ScoppedEventEngine('bot123', mockLogger)
  const incomingMw = {
    name: 'Some name',
    type: 'incoming',
    description: 'Some description',
    order: 0,
    handler: jest.fn()
  }
  const outgoingMw = { ...incomingMw, type: 'outgoing', handler: jest.fn() }

  beforeEach(() => {
    engine.load([incomingMw, outgoingMw])
    jest.resetAllMocks()
  })

  describe('when sending an incoming event', () => {
    const event = { type: 'text', direction: 'incoming', channel: 'web', target: 'user_id' }

    it('should call incoming middleware', async () => {
      await engine.sendIncoming(event)
      expect(incomingMw.handler).toHaveBeenCalled()
    })

    it('should not call outgoing middleware', async () => {
      await engine.sendIncoming(event)
      expect(outgoingMw.handler).not.toHaveBeenCalled()
    })
  })

  describe('when sending an outgoing event', () => {
    const event = { type: 'text', direction: 'outgoing', channel: 'web', target: 'user_id' }

    it('should call incoming middleware', async () => {
      await engine.sendOutgoing(event)
      expect(outgoingMw.handler).toHaveBeenCalled()
    })

    it('should not call outgoing middleware', async () => {
      await engine.sendOutgoing(event)
      expect(incomingMw.handler).not.toHaveBeenCalled()
    })
  })
})
