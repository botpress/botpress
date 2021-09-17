import Joi from 'joi'
import { FLAGGED_MESSAGE_STATUSES, FLAG_REASONS, RESOLUTION_TYPES } from '../types'

export const FlaggedEventSchema = Joi.object({
  eventId: Joi.string().required(),
  botId: Joi.string().required(),
  language: Joi.string().required(),
  preview: Joi.string().required(),
  reason: Joi.string()
    .valid(...FLAG_REASONS)
    .required(),
  status: Joi.string().valid(...FLAGGED_MESSAGE_STATUSES),
  resolutionType: Joi.string().valid(...RESOLUTION_TYPES),
  resolution: Joi.string().allow(null),
  resolutionParams: Joi.alternatives()
    .try(Joi.string(), Joi.object())
    .allow(null)
})

export const FlaggedEventArraySchema = Joi.array().items(FlaggedEventSchema)
