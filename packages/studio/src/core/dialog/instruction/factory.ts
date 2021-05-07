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

  static createOnReceive(node, flow): Instruction[] | undefined {
    const flowReceive = _.get(flow, 'catchAll.onReceive', []) || []

    // We return undefined instead of an empty array so we can "wait" even when the array is empty
    // Used for "wait for message"
    if (!node.onReceive) {
      return undefined
    }

    return [...flowReceive, ...node.onReceive].map(
      (x): Instruction => ({
        type: 'on-receive',
        fn: x
      })
    )
  }

  static createTransition(flow, node?): Instruction[] {
    const nodeNext = _.get(node, 'next', []) || []
    let flowNext = _.get(flow, 'catchAll.next', []) || []

    // Skip transitions that contains the current node to prevent infinite looping
    flowNext = flowNext.filter(n => n.node !== ((node && node.name) || undefined))

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
