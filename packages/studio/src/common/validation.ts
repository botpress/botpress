import Joi from 'joi'

export const BOTID_REGEX = /^[A-Z0-9]+[A-Z0-9_-]{1,}[A-Z0-9]+$/i
export const isValidBotId = (botId: string): boolean => BOTID_REGEX.test(botId)

export const BotEditSchema = Joi.object().keys({
  name: Joi.string()
    .allow('')
    .max(50),
  category: Joi.string().allow(null),
  description: Joi.string()
    .max(500)
    .allow(''),
  disabled: Joi.bool(),
  private: Joi.bool(),
  defaultLanguage: Joi.string()
    .min(2)
    .max(3),
  languages: Joi.array().items(
    Joi.string()
      .min(2)
      .max(3)
  ),
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
