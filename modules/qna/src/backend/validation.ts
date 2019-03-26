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
  questions: Joi.array()
    .items(Joi.string())
    .default([]),
  answers: Joi.array()
    .items(Joi.string())
    .default([]),
  answer: Joi.string().optional()
})
