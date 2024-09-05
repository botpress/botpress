import { webhookStateSchema } from '../src/schemas/states'

export const states = {
  webhookState: {
    type: 'integration',
    schema: webhookStateSchema,
  },
}

export default states
