import { BotpressEvent } from 'botpress-module-sdk'
import 'reflect-metadata'
import sinon from 'sinon'

import { DialogEngine } from './dialog-engine'
jest.mock('./flow-service')
jest.mock('./session-service')
import { flow, session } from './mocks'

const SESSION_ID = 'some_user_id'

export function createSpyObj(baseName, methodNames) {
  const obj: any = {}

  for (let i = 0; i < methodNames.length; i++) {
    obj[methodNames[i]] = jest.fn()
  }
  return obj
}

describe('DialogEngine', () => {
  let dialogEngine: DialogEngine
  const processor = createSpyObj('InstructionProcessor', ['process'])
  const sessionService = createSpyObj('SessionService', ['getSession', 'createSession'])
  const flowService = createSpyObj('FlowService', ['loadAll'])
  const logger = createSpyObj('Logger', [])
  const event: BotpressEvent = {
    type: 'slack',
    target: 'something',
    channel: 'web',
    direction: 'incoming'
  }

  describe('when a session exists', () => {
    beforeEach(() => {
      const strFlow = JSON.stringify([flow])
      flowService.loadAll.mockReturnValue(strFlow)
      sessionService.getSession.mockReturnValue(JSON.stringify(session))
      dialogEngine = new DialogEngine(processor, flowService, sessionService, logger)
    })

    it('should get the session', async () => {
      await dialogEngine.processMessage(SESSION_ID, event)

      expect(sessionService.getSession).toHaveBeenCalled()
      expect(sessionService.createSession).not.toHaveBeenCalled()
    })
  })

  // describe('when a session doesnt exists', () => {
  //   beforeEach(() => {
  //     const strFlow = JSON.stringify([flow])
  //     flowService.loadAll.mockReturnValue(strFlow)
  //     sessionService.getSession.mockReturnValue(undefined)
  //     sessionService.createSession.mockReturnValue(JSON.stringify(session))
  //     dialogEngine = new DialogEngine(processor, flowService, sessionService, logger)
  //   })

  //   it('should create a new session', async () => {
  //     await dialogEngine.processMessage(SESSION_ID, event)

  //     expect(sessionService.createSession).toHaveBeenCalled()
  //   })
  // })
})
