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
    this.instructions.unshift(...onEnter)

    if (!_.isEmpty(onReceive)) {
      const wait = InstructionFactory.createWait()
      this.instructions.unshift(wait)
    }

    this.instructions.unshift(...onReceive)
    this.instructions.unshift(...transition)
    return this.instructions
  }

  enqueue(...instruction: Instruction[]) {
    this.instructions.unshift(...instruction)
  }

  dequeue(): Instruction | undefined {
    const instruction = this.instructions.pop()!
    this.waiting = instruction.type === 'wait'
    return instruction
  }

  hasInstructions(): boolean {
    return this.instructions.length > 0
  }

  hasWait(): boolean {
    return this.waiting
  }

  retry(instruction: Instruction) {
    const wait = InstructionFactory.createWait()
    this.instructions.push(instruction)
    this.instructions.push(wait)
  }
}
