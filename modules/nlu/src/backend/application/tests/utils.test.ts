import { NLU } from 'botpress/sdk'
import crypto from 'crypto'

const halfmd5 = (text: string) => {
  return crypto
    .createHash('md5')
    .update(text)
    .digest('hex')
    .slice(16)
}

export const computeContentHash = (
  entityDefs: NLU.EntityDefinition[],
  intentDefs: NLU.IntentDefinition[],
  languageCode: string
) => {
  const singleLangIntents = intentDefs.map(i => ({ ...i, utterances: i.utterances[languageCode] }))
  return halfmd5(JSON.stringify({ singleLangIntents, entityDefs }))
}

export const computeSpecificationsHash = (specifications: NLU.Specifications) => {
  return halfmd5(JSON.stringify({ specifications }))
}

export const areEqual = (id1: NLU.ModelId, id2: NLU.ModelId): boolean => {
  return (
    id1.contentHash === id2.contentHash &&
    id1.specificationHash === id2.specificationHash &&
    id1.languageCode === id2.languageCode &&
    id1.seed === id2.seed
  )
}

export const sleep = async (ms: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

test(__filename, () => {})
