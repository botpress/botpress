import * as sdk from '@botpress/sdk'
import * as env from './.genenv'
import knowledge from './bp_modules/knowledge'
import openai from './bp_modules/openai'
import personality from './bp_modules/personality'
import telegram from './bp_modules/telegram'

export default new sdk.BotDefinition({})
  .addIntegration(telegram, {
    enabled: true,
    configuration: {
      botToken: env.KNOWLEDGIANI_TELEGRAM_BOT_TOKEN,
    },
  })
  .addIntegration(openai, {
    enabled: true,
    configuration: {},
  })
  .addPlugin(personality, {
    configuration: {
      model: 'gpt-3.5-turbo-0125',
      personality: 'Respond as if you were Mario the famous video game character of Nintendo',
    },
    interfaces: {
      llm: {
        id: openai.id,
        name: openai.name,
        version: openai.version,
        entities: openai.definition.interfaces!['llm<modelRef>'].entities,
        actions: openai.definition.interfaces!['llm<modelRef>'].actions,
        events: openai.definition.interfaces!['llm<modelRef>'].events,
        channels: openai.definition.interfaces!['llm<modelRef>'].channels,
      },
    },
  })
  .addPlugin(knowledge, {
    configuration: {},
    interfaces: {
      llm: {
        id: openai.id,
        name: openai.name,
        version: openai.version,
        entities: openai.definition.interfaces!['llm<modelRef>'].entities,
        actions: openai.definition.interfaces!['llm<modelRef>'].actions,
        events: openai.definition.interfaces!['llm<modelRef>'].events,
        channels: openai.definition.interfaces!['llm<modelRef>'].channels,
      },
    },
  })
