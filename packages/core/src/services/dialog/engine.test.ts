import _ from 'lodash'
import 'reflect-metadata'

import { createSpyObject } from '../../misc/utils'
import { DialogSession } from '../../repositories/session-repository'

import { DialogEngine } from './engine'
import { InstructionQueue } from './instruction-queue'
import { context, flows } from './stubs'

class TestDialogEngine extends DialogEngine {
  processQueue(queue, session) {
    return super.processQueue(queue, session)
  }

  transitionToNode(next, session) {
    return super.transitionToNode(next, session)
  }

  loadFlowsForBot() {
    return super.loadFlowsForBot()
  }
}

describe('Dialog Engine', () => {
  const sessionService = createSpyObject('getSession', 'createSession', 'updateSession')
  const flowService = createSpyObject('loadAll')
  const instructionProcessor = createSpyObject('process')
  const queue = new InstructionQueue()

  beforeEach(() => {
    jest.resetAllMocks()
    queue.clear()
  })

  describe('Process instructions', () => {
    it('Call the instruction processor', async () => {
      givenInstructionsAreSuccessful()
      const dialogEngine = new TestDialogEngine(instructionProcessor, flowService, sessionService)
      const session = stubSession()
      queue.createFromContext(session.context)

      await dialogEngine.processQueue(queue, session)

      expect(instructionProcessor.process).toHaveBeenCalled()
    })

    it('Stop processing after encountering a wait instruction', async () => {
      givenInstructionsAreSuccessful()

      const dialogEngine = new TestDialogEngine(instructionProcessor, flowService, sessionService)
      const session = stubSession()
      queue.enqueue({ type: 'on-enter' }, { type: 'wait' }, { type: 'on-receive' })

      await dialogEngine.processQueue(queue, session)

      expect(queue[0]).toEqual({ type: 'on-receive' })
    })

    it('Transit to next node if condition is sucessful', async () => {
      givenInstructionsAreSuccessful()
      const dialogEngine = new TestDialogEngine(instructionProcessor, flowService, sessionService)
      queue.enqueue({ type: 'transition', node: 'another-node' })
      const spy = spyOn(dialogEngine, 'transitionToNode')

      await dialogEngine.processQueue(queue, stubSession())

      expect(spy).toHaveBeenCalledWith('another-node')
    })
  })

  describe('Transit to another node', () => {
    let dialogEngine: TestDialogEngine
    let session: DialogSession

    beforeEach(() => {
      dialogEngine = new TestDialogEngine(instructionProcessor, flowService, sessionService)
      session = stubSession()
      flowService.loadAll.mockReturnValue(flows)
      dialogEngine.loadFlowsForBot()
    })

    it('Assign current node as the next node in the current flow', async () => {
      await dialogEngine.transitionToNode('welcome', session)

      expect(session.context.currentNode.name).toEqual('welcome')
      expect(session.context.currenFlow.name).toEqual('main.flow.json')
      expect(sessionService.updateSession).toHaveBeenCalled()
    })

    it('Assign current node as the starting node of the next flow', async () => {
      await dialogEngine.transitionToNode('other.flow.json', session)

      expect(session.context.currentNode.name).toEqual('entry')
      expect(session.context.currenFlow.name).toEqual('other.flow.json')
      expect(sessionService.updateSession).toHaveBeenCalled()
    })

    it('Assign current node as the last called node in the parent flow', async () => {
      await dialogEngine.transitionToNode('other.flow.json', session)
      await dialogEngine.transitionToNode('##', session)

      expect(session.context.currentNode.name).toEqual('entry')
      expect(session.context.currenFlow.name).toEqual('main.flow.json')
    })

    it('Assign current node as a specific node of the parent flow', async () => {
      await dialogEngine.transitionToNode('other.flow.json', session)
      await dialogEngine.transitionToNode('#welcome', session)

      expect(session.context.currentNode.name).toEqual('welcome')
      expect(session.context.currenFlow.name).toEqual('main.flow.json')
    })

    it('Throws when the node or the flow doesnt exists', () => {
      expect(dialogEngine.transitionToNode('unknown', session)).rejects.toEqual(
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
