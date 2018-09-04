import _ from 'lodash'

import { InstructionFactory } from './instruction-factory'
import { Instruction } from './instruction-processor'

export class InstructionQueue {
  private instructions: Instruction[] = []
  private waiting = false

  clear() {
    this.instructions = []
  }

  enqueueContextInstructions(context) {
    const onEnter = InstructionFactory.createOnEnter(context)
    const onReceive = InstructionFactory.createOnReceive(context)
    const transition = InstructionFactory.createTransition(context)

    this.instructions = []
    this.instructions.push(...onEnter)

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

  retry(instruction: Instruction) {
    const wait = InstructionFactory.createWait()
    this.instructions.unshift(instruction)
    this.instructions.unshift(wait)
  }
}
