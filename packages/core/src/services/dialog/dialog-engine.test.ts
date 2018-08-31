import { BotpressEvent } from 'botpress-module-sdk'
import _ from 'lodash'
import 'reflect-metadata'

import { createSpyObject } from '../../misc/utils'

import { DialogEngine } from './dialog-engine'
import { context, flows, session } from './stubs'

const SESSION_ID = 'some_user_id'

describe('Dialog Engine', () => {
  const sessionService = createSpyObject('getSession', 'createSession', 'updateSession')
  const flowService = createSpyObject('loadAll')
  const instructionFactory = createSpyObject('createWait')
  const instructionProcessor = createSpyObject('process')

  const event: BotpressEvent = {
    type: 'any',
    target: 'any',
    direction: 'incoming',
    channel: 'any'
  }

  describe('Process instructions', () => {
    it('Call the instruction processor', async () => {
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

    it('Wait on fail and retry the failed instruction', async () => {
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
      dialogEngine.instructions = [{ type: 'transition', node: 'another-node' }]
      const spy = spyOn(dialogEngine, 'transitionToNode')

      await dialogEngine.processInstructions()

      expect(spy).toHaveBeenCalledWith('another-node')
    })
  })

  describe('Transit to another node', () => {
    let dialogEngine: DialogEngine

    beforeEach(() => {
      dialogEngine = new DialogEngine(instructionFactory, instructionProcessor, flowService, sessionService)
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

  function givenWaitInstruction() {
    instructionFactory.createWait.mockReturnValue({ type: 'wait' })
  }

  function givenInstructionsAreSuccessful(success: boolean = true) {
    instructionProcessor.process.mockReturnValue(success)
  }

  function stubSession() {
    return { id: 'an_id', context: context, event: '' }
  }
})
