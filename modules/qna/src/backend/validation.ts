import Joi from 'joi'

const QnaItemContentAnswerSchema = Joi.object().pattern(
  Joi.string(),
  Joi.alternatives().try(
    Joi.number(),
    Joi.boolean(),
    // tslint:disable-next-line
    Joi.allow(null),
    Joi.string().allow(''),
    Joi.array().items(Joi.object())
  )
)

export const QnaDefSchema = Joi.object().keys({
  action: Joi.string().required(),
  // Keeping optional category for import schema validation
  category: Joi.string().optional(),
  contexts: Joi.array()
    .items(Joi.string())
    .optional(),
  enabled: Joi.bool().required(),
  redirectFlow: Joi.string()
    .allow('')
    .optional(),
  redirectNode: Joi.string()
    .allow('')
    .optional(),
  questions: Joi.object()
    .pattern(/.*/, Joi.array().items(Joi.string()))
    .default({}),
  answers: Joi.object()
    .pattern(/.*/, Joi.array().items(Joi.string()))
    .default({}),
  contentAnswers: Joi.array()
    .items(QnaItemContentAnswerSchema)
    .default([]),
  lastModified: Joi.date().optional()
})

const QnaItemSchema = Joi.object().keys({
  id: Joi.string().required(),
  data: QnaDefSchema
})

export const QnaItemArraySchema = Joi.array().items(QnaItemSchema)

export const QnaItemCmsArraySchema = Joi.object().keys({
  qnas: Joi.array().items(QnaItemSchema),
  contentElements: Joi.array().items(Joi.object())
})
