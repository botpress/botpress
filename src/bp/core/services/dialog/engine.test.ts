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

class DialogEngineTest extends DialogEngineV2 {
  async transition(sessionId, event, transitionTo) {
    await this._transition(sessionId, event, transitionTo)
  }

  async loadFlows(botId) {
    await this._loadFlows(botId)
  }
}

describe('Dialog Engine', () => {
  const logger: MockObject<PersistedConsoleLogger> = createSpyObject<PersistedConsoleLogger>()
  const flowService: MockObject<FlowService> = createSpyObject<FlowService>()
  const sessionService: MockObject<SessionService> = createSpyObject<SessionService>()
  const instructionProcessor: MockObject<InstructionProcessor> = createSpyObject<InstructionProcessor>()
  const hookService: MockObject<HookService> = createSpyObject<HookService>()
  let dialogEngine: DialogEngineTest

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

  const setupMocks = () => {
    jest.resetAllMocks()
    sessionService.getSession.mockReturnValue(SESSION)
    sessionService.createSession.mockReturnValue(SESSION)
    sessionService.updateSessionEvent.mockReturnValue(SESSION)
    flowService.loadAll.mockReturnValue(flowsStub)
    logger.forBot.mockReturnValue(logger)
  }

  beforeEach(() => {
    setupMocks()
    dialogEngine = new DialogEngineTest(
      logger.T,
      flowService.T,
      sessionService.T,
      instructionProcessor.T,
      hookService.T
    )
  })

  describe('process event', () => {
    it('load all flows', async () => {
      await dialogEngine.processEvent(SESSION_ID, EVENT)
      expect(flowService.loadAll).toHaveBeenCalled()
    })

    it('throws an error if flows were not found', async () => {
      flowService.loadAll.mockReturnValue(undefined)
      await expectAsync(dialogEngine.processEvent(SESSION_ID, EVENT), x => x.toThrow())
    })

    it('updates the session with the event', async () => {
      await dialogEngine.processEvent(SESSION_ID, EVENT)
      expect(sessionService.updateSessionEvent).toHaveBeenCalledWith(SESSION_ID, EVENT)
    })

    it('create a session if it doesnt exists', async () => {
      sessionService.getSession.mockReturnValue(undefined)

      const newContext = {
        currentFlowName: 'main.flow.json',
        currentNodeName: 'entry'
      }

      await dialogEngine.processEvent(SESSION_ID, EVENT)
      expect(sessionService.createSession).toHaveBeenCalledWith(SESSION_ID, BOT_ID, {}, newContext, EVENT)
    })

    it('process an instruction', async () => {
      await dialogEngine.processEvent(SESSION_ID, EVENT)
      expect(instructionProcessor.process).toHaveBeenCalled()
    })

    it('throws on an instruction processor error', async () => {
      instructionProcessor.process.mockRejectedValue(new Error('Big fail'))
      await expectAsync(dialogEngine.processEvent(SESSION_ID, EVENT), x => x.toThrow())
    })
  })

  describe('transition', () => {
    beforeEach(async () => {
      await dialogEngine.loadFlows(BOT_ID)
    })

    it('transition to the start node of the flow', async () => {
      await dialogEngine.transition(SESSION_ID, EVENT, 'other.flow.json')

      const expected = { ...SESSION, context: { currentNodeName: 'entry', currentFlowName: 'other.flow.json' } }
      expect(sessionService.updateSession).toHaveBeenCalledWith(expected)
    })

    it('transition to the previous flow when exiting a subflow', async () => {
      const session = {
        ...SESSION,
        context: {
          currentNodeName: 'entry',
          currentFlowName: 'other.flow.json',
          previousNodeName: 'entry',
          previousFlowName: 'main.flow.json'
        }
      }
      sessionService.getSession.mockReturnValue(session)

      await dialogEngine.transition(SESSION_ID, EVENT, '#')

      expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentNodeName', 'entry')
      expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentFlowName', 'main.flow.json')
    })

    it('"END" transition deletes the session', async () => {
      await dialogEngine.transition(SESSION_ID, EVENT, 'END')

      expect(sessionService.deleteSession).toHaveBeenCalledWith(SESSION_ID)
      expect(sessionService.updateSession).not.toHaveBeenCalled()
    })

    it('transition to the target node of the current flow', async () => {
      const session = { ...SESSION, context: { currentFlowName: 'main.flow.json', currentNodeName: 'entry' } }
      sessionService.getSession.mockReturnValue(session)
      await dialogEngine.transition(SESSION_ID, EVENT, 'welcome')

      expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentNodeName', 'welcome')
      expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentFlowName', 'main.flow.json')
    })
  })
})
