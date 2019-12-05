// TODO: Yann / Renaud to re-write these tests

// import 'reflect-metadata'

// import { createMockLogger, createSpyObject, expectAsync, MockObject } from '../../misc/utils'
// import { DialogSession } from '../../repositories'
// import { IOEvent } from '../../sdk/impl'
// import { HookService } from '../hook/hook-service'

// import { DialogEngine } from './engine'
// import { FlowService } from './flow/service'
// import { InstructionProcessor } from './instruction/processor'

// import { flowsStub, timeoutFlow } from './stubs'

// class DialogEngineTest extends DialogEngine {
//   async transition(sessionId, event, transitionTo) {
//     await this._transition(sessionId, event, transitionTo)
//   }

//   async loadFlows(botId) {
//     await this._loadFlows(botId)
//   }
// }

// describe('Dialog Engine', () => {
//   const logger = createMockLogger()
//   const flowService: MockObject<FlowService> = createSpyObject<FlowService>()
//   const instructionProcessor: MockObject<InstructionProcessor> = createSpyObject<InstructionProcessor>()
//   const hookService: MockObject<HookService> = createSpyObject<HookService>()
//   let dialogEngine: DialogEngineTest

//   const SESSION_ID = 'sessionId'
//   const BOT_ID = 'botId'
//   const EVENT = new IOEvent({
//     type: '',
//     channel: '',
//     direction: 'incoming',
//     payload: '',
//     target: '',
//     botId: BOT_ID
//   })
//   const context = { currentFlowName: 'main.flow.json', currentNodeName: 'entry' }
//   const SESSION = new DialogSession(SESSION_ID, BOT_ID, {}, context, EVENT)

//   const setupMocks = () => {
//     flowService.loadAll.mockResolvedValue(flowsStub)
//   }

//   beforeEach(() => {
//     setupMocks()
//     dialogEngine = new DialogEngineTest(logger, flowService.T, instructionProcessor.T, hookService.T)
//   })

//   afterEach(() => {
//     jest.clearAllMocks()
//     jest.resetAllMocks()
//   })

//   describe('process event', () => {
//     it('load flows for bot', async () => {
//       await dialogEngine.processEvent(SESSION_ID, EVENT)
//       expect(flowService.loadAll).toHaveBeenCalledWith(BOT_ID)
//     })

//     it('throws an error if flows were not found', async () => {
//       flowService.loadAll.mockResolvedValue(undefined)
//       await expectAsync(dialogEngine.processEvent(SESSION_ID, EVENT), x => x.toThrow())
//     })

//     it('updates the session with the event', async () => {
//       await dialogEngine.processEvent(SESSION_ID, EVENT)
//       expect(sessionService.updateSessionEvent).toHaveBeenCalledWith(SESSION_ID, EVENT)
//     })

//     it('create a session if it doesn\'t exist', async () => {
//       sessionService.getSession.mockResolvedValue(undefined)

//       const newContext = {
//         currentFlowName: 'main.flow.json',
//         currentNodeName: 'entry'
//       }

//       await dialogEngine.processEvent(SESSION_ID, EVENT)
//       expect(sessionService.createSession).toHaveBeenCalledWith(SESSION_ID, BOT_ID, {}, newContext, EVENT)
//     })

//     it('process an instruction', async () => {
//       await dialogEngine.processEvent(SESSION_ID, EVENT)
//       expect(instructionProcessor.process).toHaveBeenCalled()
//     })

//     it('throws on an instruction processor error', async () => {
//       instructionProcessor.process.mockRejectedValue(new Error('Big fail'))
//       await expectAsync(dialogEngine.processEvent(SESSION_ID, EVENT), x => x.toThrow())
//     })
//   })

//   describe('transition', () => {
//     beforeEach(async () => {
//       await dialogEngine.loadFlows(BOT_ID)
//     })

//     it('transition to the start node of the flow', async () => {
//       await dialogEngine.transition(SESSION_ID, EVENT, 'other.flow.json')

//       const expected = { ...SESSION, context: { currentNodeName: 'entry', currentFlowName: 'other.flow.json' } }
//       expect(sessionService.updateSession).toHaveBeenCalledWith(expected)
//     })

//     it('transition to the previous flow when exiting a subflow', async () => {
//       const session = {
//         ...SESSION,
//         context: {
//           currentNodeName: 'entry',
//           currentFlowName: 'other.flow.json',
//           previousNodeName: 'entry',
//           previousFlowName: 'main.flow.json'
//         }
//       }
//       sessionService.getSession.mockResolvedValue(session)

//       await dialogEngine.transition(SESSION_ID, EVENT, '#')

//       expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentNodeName', 'entry')
//       expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentFlowName', 'main.flow.json')
//     })

//     it('"END" transition deletes the session', async () => {
//       await dialogEngine.transition(SESSION_ID, EVENT, 'END')

//       expect(sessionService.deleteSession).toHaveBeenCalledWith(SESSION_ID)
//       expect(sessionService.updateSession).not.toHaveBeenCalled()
//     })

//     it('transition to the target node of the current flow', async () => {
//       const session = { ...SESSION, context: { currentFlowName: 'main.flow.json', currentNodeName: 'entry' } }
//       sessionService.getSession.mockResolvedValue(session)
//       await dialogEngine.transition(SESSION_ID, EVENT, 'welcome')

//       expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentNodeName', 'welcome')
//       expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentFlowName', 'main.flow.json')
//     })
//   })

//   describe('jump to', () => {
//     it('load flows for bot', async () => {
//       await dialogEngine.processEvent(SESSION_ID, EVENT)
//       expect(flowService.loadAll).toHaveBeenCalledWith(BOT_ID)
//     })

//     it('creates a session if it doesn\'t exist', async () => {
//       flowService.loadAll.mockResolvedValue(flowsStub)
//       sessionService.getSession
//         .mockResolvedValue(undefined) // default after successive calls
//         .mockResolvedValueOnce(undefined)
//         .mockResolvedValueOnce(SESSION)

//       await dialogEngine.jumpTo(SESSION_ID, EVENT, 'other.flow.json')
//       expect(sessionService.createSession).toHaveBeenCalled()
//     })

//     it('skips the current flow to transition to another flow', async () => {
//       const session = { ...SESSION, context: { currentFlowName: 'main.flow.json', currentNodeName: 'entry' } }
//       sessionService.getSession.mockResolvedValue(session)

//       await dialogEngine.jumpTo(SESSION_ID, EVENT, 'other.flow.json')
//       expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentNodeName', 'entry')
//       expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentFlowName', 'other.flow.json')
//     })

//     it('throws when the flow doesn\'t exist', async () => {
//       expectAsync(dialogEngine.jumpTo(SESSION_ID, EVENT, 'doesn\'t exist'), x => x.toThrow())
//     })
//   })

//   describe('process timeout', () => {
//     it('load flows for bot', async () => {
//       await dialogEngine.processEvent(SESSION_ID, EVENT)
//       expect(flowService.loadAll).toHaveBeenCalledWith(BOT_ID)
//     })

//     // it('checks for a timeout node in the current flow', async () => {
//     //   const flows = [flowWithTimeoutNode]
//     //   flowService.loadAll.mockResolvedValue(flows)

//     //   await dialogEngine.processTimeout(BOT_ID, SESSION_ID, EVENT)
//     //   expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentFlowName', 'main.flow.json')
//     //   expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentNodeName', 'timeout')
//     // })

//     // it('checks for a timeout property in the current flow', async () => {
//     //   const flows = [flowWithTimeoutProp]
//     //   const session = { ...SESSION, context: { currentFlowName: 'main.flow.json', currentNodeName: 'entry' } }
//     //   sessionService.getSession.mockResolvedValue(session)
//     //   flowService.loadAll.mockResolvedValue(flows)

//     //   await dialogEngine.processTimeout(BOT_ID, SESSION_ID, EVENT)
//     //   expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentFlowName', 'main.flow.json')
//     //   expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentNodeName', 'timeout')
//     // })

//     it('checks for a timeout.flow.json', async () => {
//       const flows = [...flowsStub, timeoutFlow]
//       const session = { ...SESSION, context: { currentFlowName: 'timeout.flow.json', currentNodeName: 'entry' } }
//       sessionService.getSession.mockResolvedValue(session)
//       flowService.loadAll.mockResolvedValue(flows)

//       await dialogEngine.processTimeout(BOT_ID, SESSION_ID, EVENT)
//       expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty(
//         'context.currentFlowName',
//         'timeout.flow.json'
//       )
//       expect(sessionService.updateSession.mock.calls[0][0]).toHaveProperty('context.currentNodeName', 'entry')
//     })

//     it('throws when no timeout flows or nodes were found', () => {
//       expectAsync(dialogEngine.processTimeout(BOT_ID, SESSION_ID, EVENT), x => x.toThrow())
//     })
//   })
// })
