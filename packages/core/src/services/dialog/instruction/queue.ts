import _ from 'lodash'

import { Instruction } from '.'
import { InstructionFactory } from './factory'

export class InstructionQueue {
  private instructions: Instruction[] = []
  private waiting = false

  clear() {
    this.instructions = []
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
