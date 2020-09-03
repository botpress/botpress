import { EntityDefCreateSchema, IntentDefCreateSchema } from 'common/validation'
import Joi from 'joi'

export const TrainInputCreateSchema = Joi.object().keys({
  language: Joi.string().required(),
  topics: Joi.object().pattern(Joi.string(), Joi.array().items(IntentDefCreateSchema)),
  entities: Joi.array().items(EntityDefCreateSchema),
  password: Joi.string().default(''),
  seed: Joi.number().optional()
})
