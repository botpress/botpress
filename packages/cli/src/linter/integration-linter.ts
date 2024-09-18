import { CreateIntegrationBody } from '../api/integration-body'
import { BaseLinter } from './base-linter'
import { INTEGRATION_RULSESET } from './rulesets/integration.ruleset'

export class IntegrationLinter extends BaseLinter {
  public constructor(definition: CreateIntegrationBody) {
    super(definition)

    this.spectral.setRuleset(INTEGRATION_RULSESET)
  }
}
