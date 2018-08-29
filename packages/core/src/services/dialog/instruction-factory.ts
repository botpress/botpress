import { injectable } from 'inversify'
import _ from 'lodash'

import { Instruction } from './instruction-processor'

// TODO: Test this class
@injectable()
export class InstructionFactory {
  createOnEnter(context) {
    const instructions = context.currentNode && context.currentNode.onEnter
    if (!instructions) {
      return []
    }

    return instructions.map(x => {
      return { type: 'on-enter', fn: x }
    })
  }

  createOnReceive(context) {
    const instructions = <Array<any>>context.currentNode && context.currentNode.onReceive
    if (!instructions) {
      return []
    }

    // TODO: Test that node relative onReceive are added
    // Execute onReceives relative to the flow before the ones relative to the node
    const flowReceive = context.currentFlow.catchAll && context.currentFlow.catchAll.onReceive
    if (!_.isEmpty(flowReceive)) {
      instructions.unshift(flowReceive)
    }

    return instructions.map(x => {
      return { type: 'on-receive', fn: x }
    })
  }

  createTransition(context) {
    // TODO: Override with flow transition if present
    const instructions = context.currentNode && context.currentNode.next
    if (!instructions) {
      return []
    }

    return instructions.map(x => {
      return { type: 'transition-condition', fn: x.condition, node: x.node }
    })
  }

  createInstructions(context) {
    const onEnter = this.createOnEnter(context)
    const onReceive = this.createOnReceive(context)
    const transition = this.createTransition(context)
    const instructions: Instruction[] = []

    instructions.unshift(...onEnter)

    if (!_.isEmpty(onReceive)) {
      instructions.unshift(this.createWait())
    }

    instructions.unshift(...onReceive, ...transition)

    return instructions
  }

  createWait(): Instruction {
    return { type: 'wait' }
  }
}
