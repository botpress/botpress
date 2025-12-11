import { CreateBotRequestBody } from '../api'
import { type Logger } from '../logger'
import { BaseLinter } from './base-linter'
import { BOT_RULESET } from './rulesets/bot.ruleset'

export class BotLinter extends BaseLinter<CreateBotRequestBody> {
  public constructor(definition: CreateBotRequestBody, logger?: Logger) {
    super(definition, BOT_RULESET, logger)
  }
}
