import Joi from 'joi'
import { SlotDefinition } from '../typings'

const keys: Record<keyof SlotDefinition, Joi.AnySchema> = {
  name: Joi.string().required(),
  entities: Joi.array()
    .items(Joi.string())
    .required()
}
export const SlotDefinitionSchema = Joi.object()
  .keys(keys)
  .unknown(true) // extra keys are accepted
