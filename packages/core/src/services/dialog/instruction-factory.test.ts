import _ from 'lodash'
import 'reflect-metadata'

import { InstructionFactory } from './instruction-factory'

const context = {
  currentNode: {
    id: 'a54a82eb7c',
    name: 'entry',
    onEnter: ['enter {}'],
    onReceive: ['receive {}'],
    next: [{ condition: 'a !== b', node: 'another-node' }]
  },
  currentFlow: {
    catchAll: {
      onReceive: ['flowReceive {}'],
      next: undefined
    }
  }
}

describe('Instruction Factory', () => {
  let queue: InstructionFactory

  beforeEach(() => {
    queue = new InstructionFactory()
  })

  describe('Create on reveice instructions', () => {
    it('Enqueue flow relative onReceive before context relative onReceive', () => {
      const onReceive = queue.createOnReceive(context)

      // The last element in the array is actually the first to pop
      expect(onReceive[0]).toEqual({ type: 'on-receive', fn: 'receive {}' })
      expect(onReceive[1]).toEqual({ type: 'on-receive', fn: 'flowReceive {}' })
    })
  })

  describe('Create transitions instructions', () => {
    it('Overrides the code transitions with the flow transitions', () => {
      const otherContext = _.cloneDeep(context)
      otherContext.currentFlow.catchAll.next = [{ condition: 'true', node: 'override' }]

      const transitions = queue.createTransition(otherContext)

      expect(transitions.pop()).toEqual({ fn: 'true', node: 'override', type: 'transition' })
      expect(_.isEmpty(transitions)).toBeTruthy()
    })
  })

  describe('Enqueue instructions', () => {
    const queue = new InstructionFactory()
    const instructions = queue.enqueueInstructions(context)

    it('Enqueue in order', () => {
      expect(instructions.pop()).toEqual({ fn: 'enter {}', type: 'on-enter' })
      expect(instructions.pop()).toEqual({ type: 'wait' })
      expect(instructions.pop()).toEqual({ fn: 'flowReceive {}', type: 'on-receive' })
      expect(instructions.pop()).toEqual({ fn: 'receive {}', type: 'on-receive' })
      expect(instructions.pop()).toEqual({ type: 'transition', node: 'another-node', fn: 'a !== b' })
    })
  })
})
