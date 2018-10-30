import 'reflect-metadata'

import { IOEvent } from '../../../core/sdk/impl'
import { PersistedConsoleLogger } from '../../logger'
import { createSpyObject, expectAsync, MockObject } from '../../misc/utils'
import { DialogSession } from '../../repositories'
import { HookService } from '../hook/hook-service'

import { DialogEngineV2 } from './engine-v2'
import { FlowService } from './flow/service'
import { InstructionProcessor } from './instruction/processor'
import { SessionService } from './session/service'
import { flowsStub } from './stubs'

describe('Dialog Engine', () => {
  const logger: MockObject<PersistedConsoleLogger> = createSpyObject<PersistedConsoleLogger>()
  const flowService: MockObject<FlowService> = createSpyObject<FlowService>()
  const sessionService: MockObject<SessionService> = createSpyObject<SessionService>()
  const instructionProcessor: MockObject<InstructionProcessor> = createSpyObject<InstructionProcessor>()
  const hookService: MockObject<HookService> = createSpyObject<HookService>()
  let dialogEngine: DialogEngineV2

  const SESSION_ID = 'sessionId'
  const BOT_ID = 'botId'
  const EVENT = new IOEvent({
    type: '',
    channel: '',
    direction: 'incoming',
    payload: '',
    target: '',
    botId: BOT_ID
  })
  const context = { currentFlowName: 'main.flow.json', currentNodeName: 'entry' }
  const SESSION = new DialogSession(SESSION_ID, BOT_ID, {}, context, EVENT)

  beforeEach(() => {
    jest.resetAllMocks()
    dialogEngine = new DialogEngineV2(logger.T, flowService.T, sessionService.T, instructionProcessor.T, hookService.T)
    sessionService.getSession.mockReturnValue(SESSION)
    sessionService.createSession.mockReturnValue(SESSION)
    sessionService.updateSessionEvent.mockReturnValue(SESSION)
    flowService.loadAll.mockReturnValue(flowsStub)
    logger.forBot.mockReturnValue(logger)
  })

  describe('process event', () => {
    describe('when flows exists', () => {
      it('load all flows', async () => {
        await dialogEngine.processEvent(SESSION_ID, EVENT)
        expect(flowService.loadAll).toHaveBeenCalled()
      })
    })

    describe('when flows doesnt exists', () => {
      it('throws an error', async () => {
        flowService.loadAll.mockReturnValue(undefined)
        await expectAsync(dialogEngine.processEvent(SESSION_ID, EVENT), x => x.toThrow())
      })
    })

    describe('when a session exists', () => {
      it('updates the session with the new event', async () => {
        await dialogEngine.processEvent(SESSION_ID, EVENT)
        expect(sessionService.updateSessionEvent).toHaveBeenCalledWith(SESSION_ID, EVENT)
      })
    })

    describe('when a session doesnt exists', () => {
      it('create a new session context', async () => {
        sessionService.getSession.mockReturnValue(undefined)

        const newContext = {
          currentFlowName: 'main.flow.json',
          currentNodeName: 'entry'
        }

        await dialogEngine.processEvent(SESSION_ID, EVENT)
        expect(sessionService.createSession).toHaveBeenCalledWith(SESSION_ID, BOT_ID, {}, newContext, EVENT)
      })
    })

    it('process instruction', async () => {
      await dialogEngine.processEvent(SESSION_ID, EVENT)
      expect(instructionProcessor.process).toHaveBeenCalled()
    })
  })
})
