import { BaseLinter } from './base-linter'
import { INTEGRATION_RULSESET } from './rulesets/integration.ruleset'

export class IntegrationLinter extends BaseLinter {
  public constructor(definition: unknown) {
    super(definition)

    this.spectral.setRuleset(INTEGRATION_RULSESET)
  }
}
