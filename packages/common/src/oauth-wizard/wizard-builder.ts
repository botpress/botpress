import type * as types from './types'
import * as wizardHandler from './wizard-handler'

export class OAuthWizardBuilder<THandlerProps extends types.HandlerProps> {
  private readonly _steps: Map<string, types.WizardStep<THandlerProps>> = new Map()

  public constructor(private readonly _handlerProps: THandlerProps) {}

  public addStep(step: types.WizardStep<THandlerProps>) {
    this._steps.set(step.id, step)
    return this
  }

  public removeStep(stepId: string) {
    this._steps.delete(stepId)
    return this
  }

  public reset() {
    this._steps.clear()
    return this
  }

  public build() {
    return new wizardHandler.OAuthWizard({
      steps: this._steps,
      handlerProps: this._handlerProps,
    })
  }
}
