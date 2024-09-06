import { IntegrationDefinitionProps } from '@botpress/sdk'
import { TrelloConfigSchema } from '../src/schemas'

export const configuration: IntegrationDefinitionProps['configuration'] = {
  schema: TrelloConfigSchema,
}
