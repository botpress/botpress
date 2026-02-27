import * as sdk from '@botpress/sdk'
import { CreateIntegrationRequestBody } from '../api'
import { type Logger } from '../logger'
import { BaseLinter } from './base-linter'
import { INTEGRATION_RULESET, INTEGRATION_RULESET_WITH_NESTED_CHECKS } from './rulesets/integration.ruleset'

// The CreateIntegrationBody type does not contain the descriptions for the secrets
export type AggregateIntegrationBody = Omit<CreateIntegrationRequestBody, 'secrets'> &
  Pick<sdk.IntegrationDefinitionProps, 'secrets'>

export class IntegrationLinter extends BaseLinter<AggregateIntegrationBody> {
  public constructor(definition: AggregateIntegrationBody, checkNested: boolean, logger?: Logger) {
    const ruleset = !checkNested ? INTEGRATION_RULESET : INTEGRATION_RULESET_WITH_NESTED_CHECKS
    super(definition, ruleset, logger)
  }
}
