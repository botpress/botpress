import { CreateInterfaceRequestBody } from '../api'
import { type Logger } from '../logger'
import { BaseLinter } from './base-linter'
import { INTERFACE_RULESET } from './rulesets/interface.ruleset'

export class InterfaceLinter extends BaseLinter<CreateInterfaceRequestBody> {
  public constructor(definition: CreateInterfaceRequestBody, logger?: Logger) {
    super(definition, INTERFACE_RULESET, logger)
  }
}
