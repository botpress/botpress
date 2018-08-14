import 'reflect-metadata'

import { ScoppedEventEngine } from './event-engine'

const mockLogger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }

describe('EventEngine', () => {
  const engine = new ScoppedEventEngine('bot123', mockLogger)
  const incomingMw = {
    name: 'Incoming MW',
    type: 'incoming',
    description: 'Some description',
    order: 20,
    handler: () => {}
  }
  const outgoingMw = {
    name: 'Outgoing MW',
    type: 'outgoing',
    description: 'Some description',
    order: 20,
    handler: () => {}
  }
  const incomingSpy = jest.spyOn(incomingMw, 'handler')
  const outgoingSpy = jest.spyOn(outgoingMw, 'handler')

  beforeEach(() => {
    engine.load([incomingMw, outgoingMw])
    incomingSpy.mockReset()
    outgoingSpy.mockReset()
  })

  describe('when sending an incoming event', () => {
    const event = { type: 'text', direction: 'incoming', channel: 'web', target: 'user_id' }

    it('should call its middleware stack', () => {
      engine.sendIncoming(event).then(() => {
        expect(incomingSpy).toHaveBeenCalled()
      })
    })

    it('should not call other middleware', () => {
      engine.sendIncoming(event).then(() => {
        expect(outgoingSpy).not.toHaveBeenCalled()
      })
    })
  })

  describe('when sending an outgoing event', () => {
    const event = { type: 'text', direction: 'outgoing', channel: 'web', target: 'user_id' }

    it('should call its middleware stack', () => {
      engine.sendOutgoing(event).then(() => {
        expect(outgoingSpy).toHaveBeenCalled()
      })
    })

    it('should not call other middleware', () => {
      engine.sendOutgoing(event).then(() => {
        expect(incomingSpy).not.toHaveBeenCalled()
      })
    })
  })
})
