import Joi from 'joi'

export const validations = {
  'events.replyToEvent': Joi.object().keys({
    event: Joi.object()
      .keys({
        botId: Joi.string().required(),
        target: Joi.string().required(),
        channel: Joi.string().required(),
        threadId: Joi.string().optional()
      })
      .pattern(/./, Joi.any())
      .required(),
    contentId: Joi.string().optional(),
    payloads: Joi.array()
      .items(Joi.object())
      .optional(),
    args: Joi.object().optional()
  }),
  'users.updateAttributes': Joi.object().keys({
    channel: Joi.string().required(),
    userId: Joi.string().required(),
    attributes: Joi.object().optional()
  }),
  'users.setAttributes': Joi.object().keys({
    channel: Joi.string().required(),
    userId: Joi.string().required(),
    attributes: Joi.object().optional()
  }),
  'kvs.set': Joi.object().keys({
    botId: Joi.string().optional(),
    key: Joi.string().required(),
    value: Joi.object().optional(),
    path: Joi.string().optional(),
    expiry: Joi.string().optional()
  }),
  'kvs.get': Joi.object().keys({
    botId: Joi.string().optional(),
    key: Joi.string().required(),
    path: Joi.string().optional()
  }),
  'cms.searchContentElements': Joi.object().keys({
    botId: Joi.string().required(),
    contentTypeId: Joi.string().optional(),
    searchParams: Joi.object()
      .keys({
        searchTerm: Joi.string().optional(),
        from: Joi.number().optional(),
        count: Joi.number().optional(),
        ids: Joi.array()
          .items(Joi.string())
          .optional(),
        sortOrder: Joi.array()
          .items(
            Joi.object().keys({
              column: Joi.string().optional(),
              desc: Joi.bool().optional()
            })
          )
          .optional()
      })
      .optional(),
    language: Joi.string().optional()
  }),
  'security.getMessageSignature': Joi.object().keys({
    message: Joi.string().required()
  })
}
