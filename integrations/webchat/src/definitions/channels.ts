import { IntegrationDefinitionProps, messages } from '@botpress/sdk'
import { z } from 'zod'

const cardSchema = messages.defaults.card.schema.extend({
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
})

const choiceSchema = messages.defaults.choice.schema.extend({
  text: z.string().min(0).optional(),
})

const dropdownSchema = messages.defaults.dropdown.schema.extend({
  text: z.string().min(0).optional(),
})

const defaults = {
  ...messages.defaults,
  choice: { schema: choiceSchema },
  dropdown: { schema: dropdownSchema },
  carousel: { schema: z.object({ items: z.array(cardSchema) }) },
  card: { schema: cardSchema },
} as const

const messagesWithClassnames = Object.fromEntries(
  Object.entries(defaults).map(([type, def]) => {
    const schema = def.schema.extend({
      className: z.string().describe('CSS className to apply to the message').optional(),
    })
    return [
      type,
      {
        ...def,
        schema,
      },
    ]
  })
)

export const channels = {
  channel: {
    messages: messagesWithClassnames,
    message: {
      tags: {
        id: {},
      },
    },
    conversation: {
      tags: {
        id: {},
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
