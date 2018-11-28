import { injectable } from 'inversify'

import { StrategyFactory } from './strategy'

import { ProcessingResult } from '.'

@injectable()
export class InstructionProcessor {
  constructor(private strategyFactory: StrategyFactory) {}

  async process(botId, instruction, event): Promise<ProcessingResult> {
    const instructionStrategy = this.strategyFactory.create(instruction.type)
    return instructionStrategy.processInstruction(botId, instruction, event)
  }
}
