import { IntegrationDefinitionProps } from '@botpress/sdk'
import { CardSchema } from 'src/schemas/entities/card'

export const entities: IntegrationDefinitionProps['entities'] = {
  card: {
    title: 'Card',
    description: 'A card in a Trello list',
    schema: CardSchema,
  },
} as const
