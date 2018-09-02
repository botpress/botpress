import _ from 'lodash'
import 'reflect-metadata'

import { createSpyObject } from '../../misc/utils'

import { DialogEngine } from './engine'
import { context, flows } from './stubs'

describe('Dialog Engine', () => {
  const sessionService = createSpyObject('getSession', 'createSession', 'updateSession')
  const flowService = createSpyObject('loadAll')
  const instructionProcessor = createSpyObject('process')

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('Process instructions', () => {
    it('Call the instruction processor', async () => {
      givenInstructionsAreSuccessful()
      const dialogEngine = new DialogEngine(instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.queue.enqueue({ type: 'on-enter' })

      await dialogEngine.processInstructions()

      expect(instructionProcessor.process).toHaveBeenCalled()
    })

    it('Stop processing after encountering a wait instruction', async () => {
      givenInstructionsAreSuccessful()

      const dialogEngine = new DialogEngine(instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.queue.enqueue({ type: 'on-receive' }, { type: 'wait' }, { type: 'on-enter' })

      await dialogEngine.processInstructions()

      expect(instructionProcessor.process).toHaveBeenCalledTimes(1)
      expect(dialogEngine.queue.dequeue()).toEqual({ type: 'on-receive' })
    })

    it('Requeue failed instruction and wait before calling another instruction', async () => {
      givenInstructionsAreSuccessful(false)
      const dialogEngine = new DialogEngine(instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.queue.enqueue({ type: 'on-enter', fn: 'b {}' }, { type: 'on-enter', fn: 'a {}' })

      await dialogEngine.processInstructions()

      expect(dialogEngine.queue.dequeue()).toEqual({ type: 'on-enter', fn: 'a {}' })
      expect(dialogEngine.queue.dequeue()).toEqual({ type: 'on-enter', fn: 'b {}' })
      expect(instructionProcessor.process).toHaveBeenCalledTimes(1)
    })

    it('Update failed attempts', async () => {
      givenInstructionsAreSuccessful(false)
      const dialogEngine = new DialogEngine(instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.queue.enqueue({ type: 'on-enter' })

      await dialogEngine.processInstructions()

      expect(dialogEngine.failedAttempts).toEqual(1)
    })

    it('Reset failed attempts on successful process', async () => {
      givenInstructionsAreSuccessful()
      const dialogEngine = new DialogEngine(instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.queue.enqueue({ type: 'on-enter' })
      dialogEngine.failedAttempts = 5

      await dialogEngine.processInstructions()

      expect(dialogEngine.failedAttempts).toEqual(0)
    })

    it('Throw on max failed attempts', async () => {
      givenInstructionsAreSuccessful(false)
      const dialogEngine = new DialogEngine(instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.queue.enqueue({ type: 'on-enter' })
      dialogEngine.failedAttempts = 9

      // Work around issue of expecting throw on async functions
      // see: https://github.com/facebook/jest/issues/1700
      expect(dialogEngine.processInstructions()).rejects.toEqual(new Error('Too many instructions failed'))
    })

    it('Transit to next node if condition is sucessful', async () => {
      givenInstructionsAreSuccessful()
      const dialogEngine = new DialogEngine(instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.queue.enqueue({ type: 'transition', node: 'another-node' })
      const spy = spyOn(dialogEngine, 'transitionToNode')

      await dialogEngine.processInstructions()

      expect(spy).toHaveBeenCalledWith('another-node')
    })
  })

  describe('Transit to another node', () => {
    let dialogEngine: DialogEngine

    beforeEach(() => {
      dialogEngine = new DialogEngine(instructionProcessor, flowService, sessionService)
      dialogEngine.currentSession = stubSession()
      dialogEngine.flows = flows
    })

    it('Assign current node as the next node in the current flow', async () => {
      await dialogEngine.transitionToNode('welcome')

      expect(dialogEngine.currentSession.context.currentNode.name).toEqual('welcome')
      expect(dialogEngine.currentSession.context.currentFlow.name).toEqual('main.flow.json')
      expect(sessionService.updateSession).toHaveBeenCalled()
    })

    it('Assign current node as the starting node of the next flow', async () => {
      await dialogEngine.transitionToNode('other.flow.json')

      expect(dialogEngine.currentSession.context.currentNode.name).toEqual('entry')
      expect(dialogEngine.currentSession.context.currentFlow.name).toEqual('other.flow.json')
      expect(sessionService.updateSession).toHaveBeenCalled()
    })

    it('Assign current node as the last called node in the parent flow', async () => {
      await dialogEngine.transitionToNode('other.flow.json')
      await dialogEngine.transitionToNode('##')

      expect(dialogEngine.currentSession.context.currentNode.name).toEqual('entry')
      expect(dialogEngine.currentSession.context.currentFlow.name).toEqual('main.flow.json')
    })

    it('Assign current node as a specific node of the parent flow', async () => {
      await dialogEngine.transitionToNode('other.flow.json')
      await dialogEngine.transitionToNode('#welcome')

      expect(dialogEngine.currentSession.context.currentNode.name).toEqual('welcome')
      expect(dialogEngine.currentSession.context.currentFlow.name).toEqual('main.flow.json')
    })

    it('Throws when the node or the flow doesnt exists', () => {
      expect(dialogEngine.transitionToNode('unknown')).rejects.toEqual(
        new Error('Could not find any node or flow under the name of "unknown"')
      )
    })
  })

  function givenInstructionsAreSuccessful(success: boolean = true) {
    instructionProcessor.process.mockReturnValue(success)
  }

  function stubSession() {
    return { id: 'an_id', context: context, event: {}, state: {} }
  }
})
