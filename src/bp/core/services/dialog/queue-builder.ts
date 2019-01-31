import _ from 'lodash'

import { Instruction } from './instruction'
import { InstructionFactory } from './instruction/factory'
import { InstructionQueue } from './instruction/queue'

export class InstructionsQueueBuilder {
  private _queue = new InstructionQueue()
  private _onlyTransitions = false
  private _skipOnEnters = false
  private _hasJumped = false

  constructor(private currentNode, private currentFlow) {}

  static fromInstructions(instructions: Instruction[]) {
    const queue = new InstructionQueue()
    queue.enqueue(...instructions)
    return queue
  }

  hasJumped() {
    this._hasJumped = true
    return this
  }

  onlyTransitions() {
    this._onlyTransitions = true
    return this
  }

  skipOnEnters() {
    this._skipOnEnters = true
    return this
  }

  build() {
    // When jumpTo is called, the flow's catchAll transitions are processed before any other instructions.
    if (this._hasJumped) {
      const catchAllTransitions = InstructionFactory.createTransition(this.currentFlow)
      this._queue.enqueue(...catchAllTransitions)
      this._hasJumped = false
    }

    if (!this._onlyTransitions) {
      if (!this._skipOnEnters) {
        const onEnter = InstructionFactory.createOnEnter(this.currentNode)
        this._queue.enqueue(...onEnter)
      }

      const onReceive = InstructionFactory.createOnReceive(this.currentNode, this.currentFlow)
      if (onReceive) {
        this._queue.enqueue({ type: 'wait' })
        this._queue.enqueue(...onReceive)
      }
    }

    const transition = InstructionFactory.createTransition(this.currentFlow, this.currentNode)

    this._queue.enqueue(...transition)

    return this._queue
  }
}
