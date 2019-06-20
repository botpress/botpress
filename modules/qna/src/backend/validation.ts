import Joi from 'joi'

export const QnaDefSchema = Joi.object().keys({
  action: Joi.string().required(),
  category: Joi.string().required(),
  enabled: Joi.bool().required(),
  redirectFlow: Joi.string()
    .optional()
    .allow(''),
  redirectNode: Joi.string()
    .optional()
    .allow(''),
  questions: Joi.object()
    .pattern(/.*/, Joi.array().items(Joi.string()))
    .default({}),
  answers: Joi.object()
    .pattern(/.*/, Joi.array().items(Joi.string()))
    .default({})
})

const QnaItemSchema = Joi.object().keys({
  id: Joi.string().required(),
  data: QnaDefSchema
})

export const QnaItemArraySchema = Joi.array().items(QnaItemSchema)
