import 'reflect-metadata'

import { Instruction } from './instruction-processor'
import { InstructionQueue } from './instruction-queue'

const context = {
  currentNode: {
    id: 'a54a82eb7c',
    name: 'entry',
    onEnter: ['enter {}'],
    onReceive: ['receive {}'],
    next: [{ condition: 'a !== b', node: 'another-node' }, { condition: 'b != c', node: 'yet-another-node' }]
  },
  currentFlow: {
    catchAll: {
      onReceive: ['flowReceive {}'],
      next: undefined
    }
  }
}

describe('Instruction Queue', () => {
  let queue: InstructionQueue

  beforeEach(() => {
    queue = new InstructionQueue()
  })

  describe('When creating onReveice instructions', () => {
    it('Enqueue flow relative onReceive before context relative onReceive', () => {
      const onReceive = queue.createOnReceive(context)
      const flowOnReceive = onReceive.pop()
      const nodeOnReceive = onReceive.pop()
      expect(flowOnReceive).toEqual({ type: 'on-receive', fn: 'flowReceive {}' })
      expect(nodeOnReceive).toEqual({ type: 'on-receive', fn: 'receive {}' })
    })
  })

  describe('When enqueuing instructions', () => {
    let instructions: Instruction[]

    beforeAll(() => {
      instructions = queue.enqueueInstructions(context)
    })

    it('Enqueue onEnter instructions first', () => {
      expect(instructions.pop()).toEqual({ fn: 'enter {}', type: 'on-enter' })
    })

    it('Enqueue a wait instruction before onReceive instructions', () => {
      expect(instructions.pop()).toEqual({ type: 'wait' })
    })
  })
})
