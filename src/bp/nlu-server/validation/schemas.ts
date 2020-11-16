import Joi from 'joi'

const EnumOccurenceSchema = Joi.object({
  name: Joi.string().required(), // ex: 'Paris', 'Montreal', 'Québec'
  synonyms: Joi.array() // ex: 'La Ville des lumières', 'City of Paris'
    .items(Joi.string())
    .optional()
    .default([])
})

const EnumSchema = Joi.object().keys({
  name: Joi.string().required(), // ex: 'cities'
  values: Joi.array()
    .items(EnumOccurenceSchema)
    .required()
    .min(1),
  fuzzy: Joi.number().default(0.9)
})

const PatternSchema = Joi.object().keys({
  name: Joi.string().required(),
  regex: Joi.string().required(),
  case_sensitive: Joi.bool().default(true),
  examples: Joi.array()
    .items(Joi.string())
    .optional()
    .default([])
})

const VariableSchema = Joi.object().keys({
  name: Joi.string().required(),
  types: Joi.array()
    .items(Joi.string())
    .optional()
    .default([])
})

const IntentSchema = Joi.object().keys({
  name: Joi.string().required(),
  variables: Joi.array()
    .items(VariableSchema)
    .optional()
    .default([]),
  examples: Joi.array()
    .items(Joi.string())
    .required()
    .min(1)
})

const TopicSchema = Joi.object().keys({
  name: Joi.string().required(),
  intents: Joi.array()
    .items(IntentSchema)
    .required()
    .min(1)
})

export const TrainInputSchema = Joi.object().keys({
  language: Joi.string().required(),
  topics: Joi.array()
    .items(TopicSchema)
    .required(), // train input with empty topics array just for entity extraction is allowed
  enums: Joi.array()
    .items(EnumSchema)
    .optional()
    .default([]),
  patterns: Joi.array()
    .items(PatternSchema)
    .optional()
    .default([]),
  password: Joi.string()
    .allow('')
    .optional()
    .default(''),
  seed: Joi.number().optional()
})
