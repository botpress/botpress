import Joi from 'joi'
import { SlotDefinition } from 'nlu-core/typings'

const keys: Record<keyof SlotDefinition, Joi.AnySchema> = {
  name: Joi.string(),
  entities: Joi.array().items(Joi.string())
}
export const SlotDefinitionSchema = Joi.object().keys(keys)
