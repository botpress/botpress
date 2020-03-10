import Joi from 'joi'

export const SlotsCreateSchema = Joi.object().keys({
  name: Joi.string().required(),
  entities: Joi.array()
    .items(Joi.string())
    .required(),
  color: Joi.number().required(),
  id: Joi.string().required()
})

export const IntentDefCreateSchema = Joi.object().keys({
  name: Joi.string().required(),
  utterances: Joi.object()
    .pattern(/.*/, Joi.array().items(Joi.string()))
    .default({}),
  slots: Joi.array()
    .items(SlotsCreateSchema)
    .default([]),
  contexts: Joi.array()
    .items(Joi.string())
    .default(['global'])
})
