import { IntegrationDefinitionProps } from '@botpress/sdk'
import { boardSchema, cardSchema, ListSchema, MemberSchema } from './schemas/entities'

export const entities = {
  card: {
    title: 'Card',
    description: 'A card in a Trello list',
    schema: cardSchema,
  },
  list: {
    title: 'List',
    description: 'A list in a Trello board',
    schema: ListSchema,
  },
  board: {
    title: 'Board',
    description: 'A Trello board',
    schema: boardSchema,
  },
  boardMember: {
    title: 'Board Member',
    description: 'A member of a Trello board',
    schema: MemberSchema,
  },
  cardMember: {
    title: 'Card Member',
    description: 'A member assigned to a Trello card',
    schema: MemberSchema,
  },
} as const satisfies IntegrationDefinitionProps['entities']
