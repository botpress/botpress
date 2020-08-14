import * as sdk from 'botpress/sdk'
import { EntityDefCreateSchema, IntentDefCreateSchema } from 'common/validation'
import Joi from 'joi'

export interface TrainInput {
  language: string
  topics: {
    [topic: string]: sdk.NLU.IntentDefinition[]
  }
  entities: sdk.NLU.EntityDefinition[]
  password: string
  seed?: number
}

export const TrainInputCreateSchema = Joi.object().keys({
  language: Joi.string().required(),
  topics: Joi.object().pattern(Joi.string(), Joi.array().items(IntentDefCreateSchema)),
  entities: Joi.array().items(EntityDefCreateSchema),
  password: Joi.string().default(''),
  seed: Joi.number().optional()
})
