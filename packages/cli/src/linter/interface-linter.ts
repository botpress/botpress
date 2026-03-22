import { CreateInterfaceRequestBody } from '../api'
import { type Logger } from '../logger'
import { BaseLinter } from './base-linter'
import { INTERFACE_RULESET, INTERFACE_RULESET_WITH_NESTED_CHECKS } from './rulesets/interface.ruleset'

export class InterfaceLinter extends BaseLinter<CreateInterfaceRequestBody> {
  public constructor(definition: CreateInterfaceRequestBody, checkNested: boolean, logger?: Logger) {
    const ruleset = !checkNested ? INTERFACE_RULESET : INTERFACE_RULESET_WITH_NESTED_CHECKS
    super(definition, ruleset, logger)
  }
}
