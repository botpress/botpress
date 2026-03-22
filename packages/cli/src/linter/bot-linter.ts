import { CreateBotRequestBody } from '../api'
import { type Logger } from '../logger'
import { BaseLinter } from './base-linter'
import { BOT_RULESET, BOT_RULESET_WITH_NESTED_CHECKS } from './rulesets/bot.ruleset'

export class BotLinter extends BaseLinter<CreateBotRequestBody> {
  public constructor(definition: CreateBotRequestBody, checkNested: boolean, logger?: Logger) {
    const ruleset = !checkNested ? BOT_RULESET : BOT_RULESET_WITH_NESTED_CHECKS
    super(definition, ruleset, logger)
  }
}
