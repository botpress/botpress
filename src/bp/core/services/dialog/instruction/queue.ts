import _ from 'lodash'

import { Instruction } from '.'
import { InstructionFactory } from './factory'

export class InstructionQueue {
  instructions: Instruction[] = []

  clear() {
    this.instructions = []
  }

  enqueue(...instruction: Instruction[]) {
    this.instructions.push(...instruction)
  }

  dequeue(): Instruction | undefined {
    return this.instructions.shift()
  }

  hasInstructions(): boolean {
    return this.instructions.length > 0
  }

  wait() {
    const wait = InstructionFactory.createWait()
    this.instructions.unshift(wait)
  }

  toString() {
    return JSON.stringify(this.instructions)
  }
}
