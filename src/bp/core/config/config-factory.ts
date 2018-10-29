import { injectable } from 'inversify'

import { BotConfigBuilder } from '.'
import { BotConfig } from './bot.config'

export type DefaultArguments = {
  id: string
  name: string
}

@injectable()
export class BotConfigFactory {
  createDefault(args: DefaultArguments): BotConfig {
    const builder = new BotConfigBuilder(args.name, args.id)

    builder.withModules('channel-web')
    builder.withContentTypes(
      'builtin_text',
      'builtin_single-choice',
      'builtin_image',
      'builtin_carousel',
      'builtin_card'
    )
    builder.withOugoingMiddleware('web.sendMessages')
    builder.enabled(true)

    return builder.build()
  }
}
