import * as sdk from '@botpress/sdk'
import { CreateIntegrationRequestBody } from '../api'
import { BaseLinter } from './base-linter'
import { INTEGRATION_RULESET } from './rulesets/integration.ruleset'

// The CreateIntegrationBody type does not contain the descriptions for the secrets
export type AggregateIntegrationBody = Omit<CreateIntegrationRequestBody, 'secrets'> &
  Pick<sdk.IntegrationDefinitionProps, 'secrets'>

export class IntegrationLinter extends BaseLinter<AggregateIntegrationBody> {
  public constructor(definition: AggregateIntegrationBody) {
    super(definition, INTEGRATION_RULESET)
  }
}
