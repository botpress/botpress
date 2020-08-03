import { NLU } from 'botpress/sdk'
import crypto from 'crypto'

import { NLUVersionInfo } from './typings'

// we might want to make this language specific
export function computeModelHash(
  intents: NLU.IntentDefinition[],
  entities: NLU.EntityDefinition[],
  version: NLUVersionInfo,
  lang: string
): string {
  const { nluVersion, langServerInfo } = version

  const singleLangIntents = intents.map(i => ({ ...i, utterances: i.utterances[lang] }))

  return crypto
    .createHash('md5')
    .update(JSON.stringify({ singleLangIntents, entities, nluVersion, langServerInfo }))
    .digest('hex')
}
