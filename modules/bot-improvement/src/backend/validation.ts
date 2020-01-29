import Joi from 'joi'

export const FeedbackItemSchema = Joi.object().keys({
  state: Joi.string()
    .valid(['pending', 'solved'])
    .required(),
  eventId: Joi.number().required(),
  correctedActionType: Joi.string().required(),
  correctedObjectId: Joi.string().required()
})
