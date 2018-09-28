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

export type FollowUpAction = 'none' | 'wait' | 'transition' | 'update'

export class ProcessingResult {
  constructor(
    public success: boolean,
    public followUpAction: FollowUpAction,
    public options?: { transitionTo?: string; state? }
  ) {}

  static updateState(state) {
    return new ProcessingResult(true, 'update', { state })
  }
  static none() {
    return new ProcessingResult(true, 'none')
  }
  static transition(destination: string) {
    return new ProcessingResult(true, 'transition', { transitionTo: destination })
  }
  static wait() {
    return new ProcessingResult(true, 'wait')
  }
}
