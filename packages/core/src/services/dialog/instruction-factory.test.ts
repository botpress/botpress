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
  describe('Create on reveice instructions', () => {
    it('Enqueue flow relative onReceive before context relative onReceive', () => {
      const onReceive = InstructionFactory.createOnReceive(context)

      expect(onReceive[0]).toEqual({ type: 'on-receive', fn: 'flowReceive {}' })
      expect(onReceive[1]).toEqual({ type: 'on-receive', fn: 'receive {}' })
    })
  })

  describe('Create transitions instructions', () => {
    it('Overrides the node transitions with the flow transitions', () => {
      const otherContext = _.cloneDeep(context)
      otherContext.currentFlow.catchAll.next = [{ condition: 'true', node: 'override' }]

      const transitions = InstructionFactory.createTransition(otherContext)

      expect(transitions).toEqual([{ fn: 'true', node: 'override', type: 'transition' }])
    })
  })
})
