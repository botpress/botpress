import _ from 'lodash'
import 'reflect-metadata'

import { InstructionFactory } from './factory'

const context = {
  currentNode: {
    id: 'a54a82eb7c',
    name: 'entry',
    onEnter: ['enter {}'],
    onReceive: ['receive {}'],
    next: [{ condition: 'true', node: 'another-node' }]
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
    it('Place flow onReceive before node onReceive', () => {
      const onReceive = InstructionFactory.createOnReceive(context)

      expect(onReceive).toEqual([
        { type: 'on-receive', fn: 'flowReceive {}' },
        { type: 'on-receive', fn: 'receive {}' }
      ])
    })
  })

  describe('Create transitions instructions', () => {
    it('Place flow transitions before node transitions', () => {
      const otherContext = _.cloneDeep(context)
      otherContext.currentFlow.catchAll.next = [{ condition: 'true', node: 'override' }]

      const transitions = InstructionFactory.createTransition(otherContext)

      expect(transitions).toEqual([
        { fn: 'true', node: 'override', type: 'transition' },
        { fn: 'true', node: 'another-node', type: 'transition' }
      ])
    })
  })
})
