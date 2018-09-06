import _ from 'lodash'

import { Instruction } from '.'

export class InstructionFactory {
  static createOnEnter(node) {
    const onEnter = _.get(node, 'onEnter', []) || []
    return onEnter.map(
      (x): Instruction => ({
        type: 'on-enter',
        fn: x
      })
    )
  }

  static createOnReceive(node, flow): Instruction[] {
    const flowReceive = _.get(flow, 'catchAll.onReceive', []) || []
    const nodeReceive = _.get(node, 'onReceive', []) || []

    return [...flowReceive, ...nodeReceive].map(
      (x): Instruction => ({
        type: 'on-receive',
        fn: x
      })
    )
  }

  static createTransition(node, flow): Instruction[] {
    const flowNext = _.get(flow, 'catchAll.next', []) || []
    const nodeNext = _.get(node, 'next', []) || []

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
