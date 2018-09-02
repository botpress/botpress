import _ from 'lodash'

import { Instruction } from './instruction-processor'

export class InstructionFactory {
  static createOnEnter(context) {
    const instructions = context.currentNode.onEnter
    if (!instructions) {
      return []
    }

    return instructions.map(x => {
      return { type: 'on-enter', fn: x }
    })
  }

  static createOnReceive(context): Instruction[] {
    const instructions = <Array<any>>context.currentNode.onReceive
    if (!instructions) {
      return []
    }

    const flowReceive = <Array<any>>context.currentFlow.catchAll.onReceive
    if (flowReceive && flowReceive.length > 0) {
      instructions.push(...flowReceive)
    }

    return <Instruction[]>instructions.map(x => {
      return { type: 'on-receive', fn: x }
    })
  }

  static createTransition(context): Instruction[] {
    const flowNext = context.currentFlow.catchAll.next
    if (flowNext) {
      return flowNext.map(x => {
        return { type: 'transition', fn: x.condition, node: x.node }
      })
    }

    const instructions = context.currentNode && context.currentNode.next
    if (!instructions) {
      return []
    }

    return instructions.map(x => {
      return { type: 'transition', fn: x.condition, node: x.node }
    })
  }

  static createWait(): Instruction {
    return { type: 'wait' }
  }
}
