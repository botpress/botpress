import Joi, { validate } from 'joi'
import { SlotDefinition } from '../typings'
import { SlotDefinitionSchema } from './schemas'

const expectValidates = async (model: any, schema: Joi.ObjectSchema) => {
  await expect(validate(model, schema)).resolves.not.toThrow()
}

const expectThrows = async (model: any, schema: Joi.ObjectSchema) => {
  await expect(validate(model, schema)).rejects.toThrow()
}

test('slot model schema', async () => {
  const shouldPass: SlotDefinition[] = [
    {
      entities: ['heyhey', 'entity'],
      name: 'someName'
    },
    {
      entities: [],
      name: 'yoyoyo'
    },
    <SlotDefinition>{
      entities: [],
      name: 'yoyoyo',
      extraKey: 42
    }
  ]

  const shouldFail: any[] = [
    undefined,
    null,
    {},
    {
      entities: undefined,
      name: 'someName'
    },
    {
      entities: ['heyhey', 'entity'],
      name: ''
    },
    {
      entities: ['heyhey', 'entity'],
      name: undefined
    },
    {
      entities: [''], // no empty entity name
      name: 'someName'
    }
  ]

  await Promise.map(shouldPass, m => expectValidates(m, SlotDefinitionSchema.required()))
  await Promise.map(shouldFail, m => expectThrows(m, SlotDefinitionSchema.required()))
})
