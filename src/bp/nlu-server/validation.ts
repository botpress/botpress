import { EntityDefCreateSchema, IntentDefCreateSchema } from 'common/validation'
import Joi from 'joi'

import { DEFAULT_DUCK_SERVER, DEFAULT_LANG_SERVER, DEFAULT_LANG_SOURCES } from './config'

// TODO: refactor this to respect specs
export const TrainInputCreateSchema = Joi.object().keys({
  language: Joi.string().required(),
  topics: Joi.object()
    .pattern(Joi.string(), Joi.array().items(IntentDefCreateSchema))
    .required(),
  entities: Joi.array()
    .items(EntityDefCreateSchema)
    .required(),
  password: Joi.string()
    .optional()
    .default(''),
  seed: Joi.number().optional()
})

const LanguageSourcesSchema = Joi.object().keys({
  endpoint: Joi.string().default(DEFAULT_LANG_SERVER),
  authToken: Joi.string().optional()
})

export const NLUConfigSchema = Joi.object().keys({
  ducklingURL: Joi.string().default(DEFAULT_DUCK_SERVER),
  ducklingEnabled: Joi.bool().default(true),
  languageSources: Joi.array()
    .items(LanguageSourcesSchema)
    .default(DEFAULT_LANG_SOURCES)
})
