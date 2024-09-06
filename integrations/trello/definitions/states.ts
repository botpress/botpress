import { IntegrationDefinitionProps } from '@botpress/sdk'
import { webhookStateSchema } from '../src/schemas/states'

export enum States {
  webhookState = 'webhookState',
}

export const states: IntegrationDefinitionProps['states'] = {
  [States.webhookState]: {
    type: 'integration',
    schema: webhookStateSchema,
  },
}

export default states
