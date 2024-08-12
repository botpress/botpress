import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from '@botpress/sdk'
import { FreshchatConfigurationSchema } from './schemas'

export { actions } from './actions'
export { events } from './events'
export { channels } from './channels'
export { states } from './states'

export const configuration = {
  schema: FreshchatConfigurationSchema,
} satisfies IntegrationDefinitionProps['configuration']

export const user = {
  tags: {
    id: z.string(),
  }
} satisfies IntegrationDefinitionProps['user']
