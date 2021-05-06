import { TYPES } from 'core/app/types'
import { inject, injectable } from 'inversify'

import { ProcessingResult } from '.'
import { ActionStrategy, TransitionStrategy } from './strategy'

@injectable()
export class InstructionProcessor {
  constructor(
    @inject(TYPES.ActionStrategy) private actionStrategy: ActionStrategy,
    @inject(TYPES.TransitionStrategy) private transitionStrategy: TransitionStrategy
  ) {}

  async process(botId, instruction, event): Promise<ProcessingResult> {
    const { type } = instruction

    if (type === 'on-enter' || type === 'on-receive') {
      return this.actionStrategy.processInstruction(botId, instruction, event)
    } else if (type === 'transition') {
      return this.transitionStrategy.processInstruction(botId, instruction, event)
    } else if (type === 'wait') {
      return ProcessingResult.wait()
    }

    throw new Error(`Undefined instruction type "${type}"`)
  }
}
