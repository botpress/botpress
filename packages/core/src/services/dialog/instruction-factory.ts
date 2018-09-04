import _ from 'lodash'
import { Transform } from 'stream'

import { Instruction } from './instruction-processor'

export class InstructionFactory {
  static createOnEnter(context) {
    const onEnter = _.reverse(_.get(context, 'currentNode.onEnter', []) || [])
    return onEnter.map(
      (x): Instruction => ({
        type: 'on-enter',
        fn: x
      })
    )
  }

  static createOnReceive(context): Instruction[] {
    const flowReceive = _.reverse(_.get(context, 'currentFlow.catchAll.onReceive', []) || [])
    const nodeReceive = _.reverse(_.get(context, 'currentNode.onReceive', []) || [])

    return [...flowReceive, ...nodeReceive].map(
      (x): Instruction => ({
        type: 'on-receive',
        fn: x
      })
    )
  }

  static createTransition(context): Instruction[] {
    const flowNext = _.reverse(_.get(context, 'currentFlow.catchAll.next', []) || [])
    const nodeNext = _.reverse(_.get(context, 'currentNode.next', []) || [])

    return [...flowNext, ...nodeNext].map(
      (x): Instruction => ({
        type: 'transition',
        fn: x.condition,
        node: x.node
      })
    )
  }

  static createWait(): Instruction {
    return { type: 'wait' }
  }
}
