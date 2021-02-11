import Joi from 'joi'
import { ListEntityModel, PatternEntity } from 'nlu-core/typings'

const arrayOfStringSchema = Joi.array().items(Joi.string())
const tableOfStringSchema = Joi.array().items(arrayOfStringSchema)

const listKeys: Record<keyof ListEntityModel, Joi.AnySchema> = {
  type: Joi.string().valid('custom.list'),
  id: Joi.string(),
  languageCode: Joi.string(),
  entityName: Joi.string(),
  fuzzyTolerance: Joi.number(),
  sensitive: Joi.boolean(),
  mappingsTokens: Joi.object().pattern(/^/, tableOfStringSchema)
}
export const ListEntityModelSchema = Joi.object().keys(listKeys)

const patternKeys: Record<keyof PatternEntity, Joi.AnySchema> = {
  name: Joi.string(),
  pattern: Joi.string(),
  examples: arrayOfStringSchema,
  matchCase: Joi.boolean(),
  sensitive: Joi.boolean()
}
export const PatternEntitySchema = Joi.object().keys(patternKeys)
