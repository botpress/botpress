import Joi from 'joi'

export const SlotsCreateSchema = Joi.object().keys({
  name: Joi.string().required(),
  entity: Joi.string().required()
})

export const IntentDefCreateSchema = Joi.object().keys({
  name: Joi.string().required(),
  utterances: Joi.array()
    .items(Joi.string())
    .default([]),
  slots: Joi.array()
    .items(SlotsCreateSchema)
    .default([]),
  contexts: Joi.array()
    .items(Joi.string())
    .default(['global'])
})
