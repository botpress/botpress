import { BotConfig, NLU, ScopedGhostService } from 'botpress/sdk'

import { Dataset } from './typings'

export const getDataset = async (bpfs: ScopedGhostService): Promise<Dataset> => {
  const intents = await bpfs.directoryListing('./intents', '*.json')
  const entities = await bpfs.directoryListing('./entities', '*.json')
  const botfile = await bpfs.readFileAsObject<BotConfig>('.', 'bot.config.json')

  return {
    defaultLanguage: botfile.defaultLanguage,
    otherLanguages: (botfile.languages || []).filter(lang => lang !== botfile.defaultLanguage),
    intents: await Promise.map(intents, file => bpfs.readFileAsObject<NLU.IntentDefinition>('./intents', file)),
    entities: await Promise.map(entities, file => bpfs.readFileAsObject<NLU.EntityDefinition>('./entities', file))
  }
}
