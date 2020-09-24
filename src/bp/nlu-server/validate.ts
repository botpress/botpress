import { validate } from 'joi'

import { TrainInputSchema } from './schemas'
import { TrainInput } from './typings'

async function validateInput(rawInput: any): Promise<TrainInput> {
  const validatedInput: TrainInput = await validate(rawInput, TrainInputSchema, {
    stripUnknown: true
  })

  // TODO: add actual validation that all slots reference existing entities
  // and all dollar signs $ reference existing slots
  return validatedInput
}

export default validateInput
