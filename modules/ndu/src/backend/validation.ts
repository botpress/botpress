import Joi from 'joi'

export const TopicSchema = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string()
    .optional()
    .allow('')
})
