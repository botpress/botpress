import { IntegrationDefinitionProps } from '@botpress/sdk'
import { TrelloConfigSchema } from './schemas'

export const configuration = {
  schema: TrelloConfigSchema,
} as const satisfies NonNullable<IntegrationDefinitionProps['configuration']>
