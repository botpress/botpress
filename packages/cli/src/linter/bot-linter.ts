import { CreateBotBody } from '../api'
import { BaseLinter } from './base-linter'
import { BOT_RULESET } from './rulesets/bot.ruleset'

export class BotLinter extends BaseLinter<CreateBotBody> {
  public constructor(definition: CreateBotBody) {
    super(definition, BOT_RULESET)
  }
}
