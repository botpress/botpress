import Joi from 'joi'
const LangStringArrSchema = Joi.object().pattern(
  Joi.string()
    .min(1)
    .max(3)
    .required(),
  Joi.array().items(
    Joi.string()
      .not()
      .empty()
  )
)

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

const contentShema = Joi.object()
  .keys({
    items: Joi.array().items(
      Joi.object().keys({
        image: Joi.string(),
        title: Joi.object().pattern(Joi.string(), Joi.string().allow(null)),
        subtitle: Joi.object().pattern(Joi.string(), Joi.string().allow(null)),
        actions: Joi.array()
      })
    ),
    image: Joi.string(),
    title: Joi.object()
      .pattern(Joi.string().max(2), Joi.string().allow(null))
      .optional(),
    markdown: Joi.boolean(),
    typing: Joi.boolean(),
    contentType: Joi.string()
  })
  .xor('items', 'image')

const QnASchema = Joi.object().keys({
  name: Joi.string(),
  contexts: Joi.array().items(Joi.string()),
  filename: Joi.string(),
  slots: Joi.array(),
  utterances: Joi.object().pattern(Joi.string().max(2), Joi.array().items(Joi.string())),
  metadata: Joi.object().keys({
    answers: Joi.object().pattern(Joi.string().max(2), Joi.array().items(Joi.string())),
    contentAnswers: Joi.array().items(contentShema),
    enabled: Joi.boolean(),
    lastModifiedOn: Joi.string().optional(),
    action: Joi.string().allow(''),
    redirectFlow: Joi.string().allow(''),
    redirectNode: Joi.string().allow('')
  })
})

export const ItemSchema = Joi.object().keys({
  id: Joi.string()
    .min(1)
    .optional(),
  questions: LangStringArrSchema.required(),
  answers: LangStringArrSchema.required(),
  contentAnswers: Joi.array()
    .items(QnaItemContentAnswerSchema)
    .default([]),
  enabled: Joi.bool().required(),
  // @deprecated Temporary to support old questions and ui
  contexts: Joi.array()
    .items(Joi.string())
    .optional(),
  location: Joi.string().optional()
})

export const QnASchemaArray = Joi.array().items(QnASchema)
