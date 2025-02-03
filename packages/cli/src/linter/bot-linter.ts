import { CreateBotRequestBody } from '../api'
import { BaseLinter } from './base-linter'
import { BOT_RULESET } from './rulesets/bot.ruleset'

export class BotLinter extends BaseLinter<CreateBotRequestBody> {
  public constructor(definition: CreateBotRequestBody) {
    super(definition, BOT_RULESET)
  }
}
