import crypto from 'crypto'
import _ from 'lodash'
import { EntityDefinition, IntentDefinition } from 'nlu/typings_v1'
import { ModelId, Specifications, ModelIdArgs, ModelIdService } from './typings'

export const HALF_MD5_REG = /^[a-fA-F0-9]{16}$/

const MD5_NIBBLES_SIZE = 32 // (128 bits/hash / 8 bits/byte) * 2 nibbles/byte === 32 nibbles/hash
export const halfmd5 = (text: string) => {
  return crypto
    .createHash('md5')
    .update(text)
    .digest('hex')
    .slice(MD5_NIBBLES_SIZE / 2)
}

const toString = (modelId: ModelId) => {
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

const _computeContentHash = (entityDefs: EntityDefinition[], intentDefs: IntentDefinition[]) => {
  const singleLangIntents = intentDefs.map(i => ({ ...i, utterances: i.utterances }))
  return halfmd5(JSON.stringify({ singleLangIntents, entityDefs }))
}

const _computeSpecificationsHash = (specifications: Specifications) => {
  return halfmd5(JSON.stringify({ specifications }))
}

const makeId = (factors: ModelIdArgs): ModelId => {
  const { entityDefs, intentDefs, languageCode, seed, specifications } = factors

  const contentHash = _computeContentHash(entityDefs, intentDefs)
  const specificationHash = _computeSpecificationsHash(specifications)

  return {
    contentHash,
    specificationHash,
    languageCode,
    seed
  }
}

const briefId = (factors: Partial<ModelIdArgs>): Partial<ModelId> => {
  const { entityDefs, intentDefs, languageCode, seed, specifications } = factors

  let briefedId: Partial<ModelId> = {}
  if (entityDefs && intentDefs) {
    const contentHash = _computeContentHash(entityDefs, intentDefs)
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

const modelIdService: ModelIdService = {
  toString,
  fromString,
  isId,
  makeId,
  briefId
}
export default modelIdService
