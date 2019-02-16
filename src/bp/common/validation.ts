import Joi from 'joi'

export const BOTID_REGEX = /^[A-Z0-9]+[A-Z0-9_-]{2,}[A-Z0-9]+$/i

export const isValidBotId = (botId: string): boolean => BOTID_REGEX.test(botId)

export const BotCreationSchema = Joi.object().keys({
  id: Joi.string()
    .regex(BOTID_REGEX)
    .required(),
  name: Joi.string()
    .min(3)
    .max(50)
    .required(),
  // tslint:disable-next-line:no-null-keyword
  category: Joi.string().allow(null),
  description: Joi.string()
    .min(3)
    .max(50)
})

export const BotEditSchema = Joi.object().keys({
  name: Joi.string()
    .min(3)
    .max(50)
    .required(),
  category: Joi.string(),
  description: Joi.string()
    .min(3)
    .max(50)
    .required()
})
