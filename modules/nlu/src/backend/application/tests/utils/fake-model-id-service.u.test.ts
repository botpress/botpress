import * as NLUEngine from './sdk.u.test'
import crypto from 'crypto'
import _ from 'lodash'

import './sdk.u.test'

// Copied from actual core modelIdService
// Once nlu module is moved in core, use the actual modelIdService, not a fake or mock (This class is easely testable)

const HALF_MD5_REG = /^[a-fA-F0-9]{16}$/

const halfmd5 = (text: string) => {
  return crypto
    .createHash('md5')
    .update(text)
    .digest('hex')
    .slice(16)
}

export const computeContentHash = (
  entityDefs: NLUEngine.EntityDefinition[],
  intentDefs: NLUEngine.IntentDefinition[],
  languageCode: string
) => {
  const singleLangIntents = intentDefs.map(i => ({ ...i, utterances: i.utterances[languageCode] }))
  return halfmd5(JSON.stringify({ singleLangIntents, entityDefs }))
}

export const computeSpecificationsHash = (specifications: NLUEngine.Specifications) => {
  return halfmd5(JSON.stringify({ specifications }))
}

const toString = (modelId: NLUEngine.ModelId) => {
  const { contentHash, specificationHash, languageCode: lang, seed } = modelId
  return `${contentHash}.${specificationHash}.${seed}.${lang}`
}

const fromString = (stringId: string) => {
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

const toId = (model: NLUEngine.Model) => {
  const { contentHash, specificationHash, seed, languageCode } = model
  return { contentHash, specificationHash, seed, languageCode }
}

const makeId = (factors: NLUEngine.ModelIdArgs): NLUEngine.ModelId => {
  const { entityDefs, intentDefs, languageCode, seed, specifications } = factors

  const contentHash = computeContentHash(entityDefs, intentDefs, languageCode)
  const specificationHash = computeSpecificationsHash(specifications)

  return {
    contentHash,
    specificationHash,
    languageCode,
    seed
  }
}

const briefId = (factors: Partial<NLUEngine.ModelIdArgs>): Partial<NLUEngine.ModelId> => {
  const { entityDefs, intentDefs, languageCode, seed, specifications } = factors

  let briefedId: Partial<NLUEngine.ModelId> = {}
  if (entityDefs && intentDefs && languageCode) {
    const contentHash = computeContentHash(entityDefs, intentDefs, languageCode)
    briefedId = { ...briefedId, contentHash }
  }
  if (languageCode) {
    briefedId = { ...briefedId, languageCode }
  }
  if (specifications) {
    const specificationHash = computeSpecificationsHash(specifications)
    briefedId = { ...briefedId, specificationHash }
  }
  if (seed) {
    briefedId = { ...briefedId, seed }
  }

  return briefedId
}

export const modelIdService: typeof NLUEngine.modelIdService = {
  toString,
  fromString,
  isId,
  toId,
  makeId,
  briefId
}
