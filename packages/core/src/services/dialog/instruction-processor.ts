import { injectable } from 'inversify'
import _ from 'lodash'

import { StrategyFactory } from './instruction-strategy'

export type InstructionType = 'transition' | 'on-enter' | 'on-receive' | 'wait' | 'breakpoint'

/**
 * @property type The type of instruction
 * @property fn The function to execute
 * @property node The target node to transit to
 */
export type Instruction = {
  type: InstructionType
  fn?: string
  node?: string
}

export type FollowUpAction = 'none' | 'wait' | 'transition'

export class ProcessingResult {
  constructor(public success: boolean, public followUpAction: FollowUpAction, public transitionTo?: string) {}

  static none() {
    return new ProcessingResult(true, 'none')
  }
  static transition(destination: string) {
    return new ProcessingResult(true, 'transition', destination)
  }
  static wait() {
    return new ProcessingResult(true, 'wait')
  }
}

@injectable()
export class InstructionProcessor {
  constructor(private strategyFactory: StrategyFactory) {}

  async process(botId, instruction, state, event, context): Promise<ProcessingResult> {
    const instructionStrategy = this.strategyFactory.create(instruction.type)
    return instructionStrategy.processInstruction(botId, instruction, state, event, context)
  }
}
