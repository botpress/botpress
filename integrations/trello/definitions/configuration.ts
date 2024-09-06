import { IntegrationDefinitionProps } from '@botpress/sdk'
import { TrelloConfigSchema } from '../src/schemas'

export const configuration = {
  schema: TrelloConfigSchema,
} as const satisfies NonNullable<IntegrationDefinitionProps['configuration']>
