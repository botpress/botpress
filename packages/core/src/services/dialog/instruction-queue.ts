import _ from 'lodash'

import { InstructionFactory } from './instruction-factory'
import { Instruction } from './instruction-processor'

export class InstructionQueue {
  private instructions: Instruction[] = []
  private waiting = false

  clear() {
    this.instructions = []
  }

  createFromContext(context, options: { skipOnEnter: boolean } = { skipOnEnter: false }) {
    this.clear()

    if (options && !options.skipOnEnter) {
      const onEnter = InstructionFactory.createOnEnter(context)
      this.instructions.push(...onEnter)
    }

    const onReceive = InstructionFactory.createOnReceive(context)
    const transition = InstructionFactory.createTransition(context)

    if (!_.isEmpty(onReceive)) {
      const wait = InstructionFactory.createWait()
      this.instructions.push(wait)
    }

    this.instructions.push(...onReceive)
    this.instructions.push(...transition)
    return this.instructions
  }

  enqueue(...instruction: Instruction[]) {
    this.instructions.push(...instruction)
  }

  dequeue(): Instruction | undefined {
    const instruction = this.instructions.shift()!
    this.waiting = instruction && instruction.type === 'wait'
    return instruction
  }

  hasInstructions(): boolean {
    return this.instructions.length > 0
  }

  isWaiting(): boolean {
    return this.waiting
  }

  wait() {
    const wait = InstructionFactory.createWait()
    this.instructions.unshift(wait)
  }
}
