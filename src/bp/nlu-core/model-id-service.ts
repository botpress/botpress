import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import { halfmd5, HALF_MD5_REG } from './tools/crypto'

/**
 * model id formatting:
 *
 * 0a1b2c3d4e5f6g7h.4e5f6g7h0a1b2c3d.42.en
 * contentHash.specificationHash.seed.languageCode
 */

const toString = (modelId: NLU.ModelId) => {
  const { contentHash, specificationHash, languageCode: lang, seed } = modelId
  return `${contentHash}.${specificationHash}.${seed}.${lang}`
}

const fromString = (stringId: string) => {
  // TODO: make sure it's actually a modelId
  const parts = stringId.split('.')

  const contentHash = parts[0]
  const specificationHash = parts[1]
  const seed = parseInt(parts[2])
  const languageCode = parts[3]

  return {
    contentHash,
    specificationHash,
    seed,
    languageCode
  }
}

const isId = (stringId: string) => {
  const parts = stringId.split('.')
  if (parts.length !== 4) {
    return false
  }

  const contentHash = parts[0]
  const specificationHash = parts[1]
  const seedStr = parts[2]
  const languageCode = parts[3]

  if (!HALF_MD5_REG.exec(contentHash) || !HALF_MD5_REG.exec(specificationHash)) {
    return false
  }

  const seed = parseInt(seedStr)
  if (_.isNaN(seed)) {
    return false
  }

  return !!/^[a-z]{2}$/.exec(languageCode)
}

const toId = (model: NLU.Model) => {
  const { contentHash, specificationHash, seed, languageCode } = model
  return { contentHash, specificationHash, seed, languageCode }
}

const _computeContentHash = (
  entityDefs: NLU.EntityDefinition[],
  intentDefs: NLU.IntentDefinition[],
  languageCode: string
) => {
  const singleLangIntents = intentDefs.map(i => ({ ...i, utterances: i.utterances[languageCode] }))
  return halfmd5(JSON.stringify({ singleLangIntents, entityDefs }))
}

const _computeSpecificationsHash = (specifications: NLU.Specifications) => {
  return halfmd5(JSON.stringify({ specifications }))
}

const makeId = (factors: NLU.ModelIdFactors): NLU.ModelId => {
  const { entityDefs, intentDefs, languageCode, seed, specifications } = factors

  const contentHash = _computeContentHash(entityDefs, intentDefs, languageCode)
  const specificationHash = _computeSpecificationsHash(specifications)

  return {
    contentHash,
    specificationHash,
    languageCode,
    seed
  }
}

const briefId = (factors: Partial<NLU.ModelIdFactors>): Partial<NLU.ModelId> => {
  const { entityDefs, intentDefs, languageCode, seed, specifications } = factors

  let briefedId: Partial<NLU.ModelId> = {}
  if (entityDefs && intentDefs && languageCode) {
    const contentHash = _computeContentHash(entityDefs, intentDefs, languageCode)
    briefedId = { ...briefedId, contentHash }
  }
  if (languageCode) {
    briefedId = { ...briefedId, languageCode }
  }
  if (specifications) {
    const specificationHash = _computeSpecificationsHash(specifications)
    briefedId = { ...briefedId, specificationHash }
  }
  if (seed) {
    briefedId = { ...briefedId, seed }
  }

  return briefedId
}

const modelIdService: typeof NLU.modelId = {
  toString,
  fromString,
  isId,
  toId,
  makeId,
  briefId
}
export default modelIdService
