import { CreateInterfaceRequestBody } from '../api'
import { BaseLinter } from './base-linter'
import { INTERFACE_RULESET } from './rulesets/interface.ruleset'

export class InterfaceLinter extends BaseLinter<CreateInterfaceRequestBody> {
  public constructor(definition: CreateInterfaceRequestBody) {
    super(definition, INTERFACE_RULESET)
  }
}
