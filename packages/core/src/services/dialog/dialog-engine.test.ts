import { BotpressEvent } from 'botpress-module-sdk'
import 'reflect-metadata'

import { DialogEngine } from './dialog-engine'
import { context, flows, session } from './stubs'

const SESSION_ID = 'some_user_id'

describe('Dialog Engine', () => {
  const sessionService = createSpyObj('', ['getSession', 'createSession', 'updateSession'])
  const flowService = createSpyObj('', ['loadAll'])
  const instructionFactory = createSpyObj('', ['createWait'])
  const instructionProcessor = createSpyObj('', ['process'])

  const event: BotpressEvent = {
    type: 'slack',
    target: '',
    direction: 'incoming',
    channel: 'web'
  }

  describe('When loading a session', () => {
    it('Get a session', async () => {
      flowService.loadAll.mockReturnValue(JSON.stringify(flows))
      sessionService.getSession.mockReturnValue(session)
      const dialogEngine = new DialogEngine(instructionFactory, instructionProcessor, flowService, sessionService)

      await dialogEngine.getOrCreateSession(SESSION_ID, event)

      expect(sessionService.getSession).toHaveBeenCalled()
    })

    it('Create a new session when it doesnt exists', async () => {
      sessionService.getSession.mockReturnValue(undefined)
      sessionService.createSession.mockReturnValue(session)
      const dialogEngine = new DialogEngine(instructionFactory, instructionProcessor, flowService, sessionService)
      dialogEngine.flowsLoaded = false
      dialogEngine.flows = flows

      await dialogEngine.getOrCreateSession(SESSION_ID, event)

      expect(sessionService.getSession).toHaveBeenCalled()
      expect(sessionService.createSession).toReturnWith(session)
    })
  })

  describe('When processing instructions', () => {
    it('Process instruction', async () => {
      givenInstructionsAreSuccessful()
      const dialogEngine = new DialogEngine(instructionFactory, instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.instructions = [{ type: 'on-enter', fn: () => {} }]

      await dialogEngine.processInstructions()

      expect(instructionProcessor.process).toHaveBeenCalled()
    })

    it('Stop processing on "wait" instruction', async () => {
      givenInstructionsAreSuccessful()
      const dialogEngine = new DialogEngine(instructionFactory, instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.instructions = [{ type: 'on-receive' }, { type: 'wait' }, { type: 'on-enter' }]

      await dialogEngine.processInstructions()

      expect(dialogEngine.instructions).toEqual([{ type: 'on-receive' }])
    })

    it('Wait on fail and push the failed instruction', async () => {
      givenInstructionsAreSuccessful(false)
      givenWaitInstruction()
      const dialogEngine = new DialogEngine(instructionFactory, instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.instructions = [{ type: 'on-enter' }]

      await dialogEngine.processInstructions()

      expect(dialogEngine.instructions).toEqual([{ type: 'on-enter' }])
    })

    it('Update failed attempts', async () => {
      givenInstructionsAreSuccessful(false)
      givenWaitInstruction()
      const dialogEngine = new DialogEngine(instructionFactory, instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.instructions = [{ type: 'on-enter' }, { type: 'on-enter' }, { type: 'on-enter' }]

      await dialogEngine.processInstructions()

      expect(dialogEngine.failedAttempts).toEqual(3)
    })

    it('Reset failed attempts on successful process', async () => {
      givenInstructionsAreSuccessful()
      givenWaitInstruction()
      const dialogEngine = new DialogEngine(instructionFactory, instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.instructions = [{ type: 'on-enter' }]
      dialogEngine.failedAttempts = 5

      await dialogEngine.processInstructions()

      expect(dialogEngine.failedAttempts).toEqual(0)
    })

    it('Throw on max failed attempts', async () => {
      givenInstructionsAreSuccessful(false)
      givenWaitInstruction()
      const dialogEngine = new DialogEngine(instructionFactory, instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.instructions = [{ type: 'on-enter' }]
      dialogEngine.failedAttempts = 9

      // Work around issue of expecting throw on async functions
      // see: https://github.com/facebook/jest/issues/1700
      expect(dialogEngine.processInstructions()).rejects.toEqual(new Error('Too many instructions failed'))
    })

    it('Transit to next node if condition is sucessful', async () => {
      givenInstructionsAreSuccessful()
      const dialogEngine = new DialogEngine(instructionFactory, instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.instructions = [{ type: 'transition-condition', node: 'another-node' }]
      const spy = spyOn(dialogEngine, 'transitionToNextNode')

      await dialogEngine.processInstructions()

      expect(spy).toHaveBeenCalledWith('another-node')
    })
  })

  describe('When transiting to another node', () => {
    let dialogEngine: DialogEngine

    beforeEach(() => {
      dialogEngine = new DialogEngine(instructionFactory, instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.flows = flows
    })

    it('Assign the next node and keep the same flow', async () => {
      await dialogEngine.transitionToNextNode('welcome')

      expect(dialogEngine.currentSession.context.currentNode.name).toEqual('welcome')
      expect(dialogEngine.currentSession.context.currentFlow.name).toEqual('main.flow.json')
      expect(sessionService.updateSession).toHaveBeenCalled()
    })

    it('Assign the next node as the starting node of the next flow', async () => {
      await dialogEngine.transitionToNextNode('other.flow.json')

      expect(dialogEngine.currentSession.context.currentNode.name).toEqual('entry')
      expect(dialogEngine.currentSession.context.currentFlow.name).toEqual('other.flow.json')
      expect(sessionService.updateSession).toHaveBeenCalled()
    })
  })

  function givenWaitInstruction() {
    instructionFactory.createWait.mockReturnValue({ type: 'wait' })
  }

  function givenInstructionsAreSuccessful(success: boolean = true) {
    instructionProcessor.process.mockReturnValue(success)
  }

  function createSpyObj(baseName, methodNames) {
    const obj: any = {}

    for (let i = 0; i < methodNames.length; i++) {
      obj[methodNames[i]] = jest.fn()
    }
    return obj
  }

  function stubSession() {
    return { id: 'an_id', context: context, event: '' }
  }
})
