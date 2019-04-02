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
    .max(50),
  pipeline_status: {
    current_stage: {
      promoted_by: Joi.string(),
      promoted_on: Joi.date(),
      id: Joi.string()
    }
  },
  locked: Joi.bool()
})

export const BotEditSchema = Joi.object().keys({
  name: Joi.string()
    .min(3)
    .max(50)
    .required(),
  // tslint:disable-next-line:no-null-keyword
  category: Joi.string().allow(null),
  description: Joi.string()
    .min(3)
    .max(50)
    .required(),
  disabled: Joi.bool(),
  private: Joi.bool(),
  details: {
    website: Joi.string()
      .uri()
      .optional()
      .allow(''),
    termsConditions: Joi.string()
      .uri()
      .optional()
      .allow(''),
    privacyPolicy: Joi.string()
      .uri()
      .optional()
      .allow(''),
    phoneNumber: Joi.string()
      .max(20)
      .optional()
      .allow(''),
    emailAddress: Joi.string()
      .email()
      .optional()
      .allow(''),
    avatarUrl: Joi.string()
      .optional()
      .allow(''),
    coverPictureUrl: Joi.string()
      .optional()
      .allow('')
  }
})
