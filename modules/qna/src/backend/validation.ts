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
    .items(Joi.alternatives().try(Joi.string().required(), Joi.object().keys({ contentId: Joi.string().required() })))
    .default([]),
  answer: Joi.alternatives()
    .try(Joi.string().required(), Joi.object().keys({ contentId: Joi.string().required() }))
    .optional()
})
