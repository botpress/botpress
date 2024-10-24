import { type CreateBotBody } from '../api/bot-body'
import { BOT_RULESET } from './rulesets/bot.ruleset'
import { BaseLinter } from './base-linter'

export class BotLinter extends BaseLinter<CreateBotBody> {
  public constructor(definition: CreateBotBody) {
    super(definition, BOT_RULESET)
  }
}
