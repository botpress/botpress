import _ from 'lodash'

import { InstructionFactory } from './instruction/factory'
import { InstructionQueue } from './instruction/queue'

export class InstructionsQueueBuilder {
  private _queue = new InstructionQueue()
  private _onlyTransitions = false
  private _skipOnEnters = false

  constructor(private currentNode, private currentFlow) {}

  onlyTransitions() {
    this._onlyTransitions = true
    return this
  }

  skipOnEnters() {
    this._skipOnEnters = true
    return this
  }

  build() {
    if (!this._onlyTransitions) {
      if (!this._skipOnEnters) {
        const onEnter = InstructionFactory.createOnEnter(this.currentNode)
        this._queue.enqueue(...onEnter)
      }

      const onReceive = InstructionFactory.createOnReceive(this.currentNode, this.currentFlow)
      if (!_.isEmpty(onReceive)) {
        this._queue.enqueue({ type: 'wait' })
      }
      this._queue.enqueue(...onReceive)
    }

    const transition = InstructionFactory.createTransition(this.currentNode, this.currentFlow)

    this._queue.enqueue(...transition)

    return this._queue
  }
}
