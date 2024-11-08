import { type CreateInterfaceBody } from '../api/interface-body'
import { BaseLinter } from './base-linter'
import { INTERFACE_RULESET } from './rulesets/interface.ruleset'

export class InterfaceLinter extends BaseLinter<CreateInterfaceBody> {
  public constructor(definition: CreateInterfaceBody) {
    super(definition, INTERFACE_RULESET)
  }
}
