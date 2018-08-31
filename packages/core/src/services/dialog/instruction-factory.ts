import { injectable } from 'inversify'
import _ from 'lodash'

import { Instruction } from './instruction-processor'

@injectable()
export class InstructionFactory {
  createOnEnter(context) {
    const instructions = context.currentNode.onEnter
    if (!instructions) {
      return []
    }

    return instructions.map(x => {
      return { type: 'on-enter', fn: x }
    })
  }

  createOnReceive(context): Instruction[] {
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

  createTransition(context): Instruction[] {
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

  createWait(): Instruction {
    return { type: 'wait' }
  }

  enqueueInstructions(context): Instruction[] {
    const onEnter = this.createOnEnter(context)
    const onReceive = this.createOnReceive(context)
    const transition = this.createTransition(context)
    const instructions: Instruction[] = []

    instructions.unshift(...onEnter)

    if (!_.isEmpty(onReceive)) {
      const wait = this.createWait()
      instructions.unshift(wait)
    }

    instructions.unshift(...onReceive)
    instructions.unshift(...transition)

    return instructions
  }
}
