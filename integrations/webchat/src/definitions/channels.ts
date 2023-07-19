import { IntegrationDefinitionProps, messages } from '@botpress/sdk'
import { z } from 'zod'

const cardSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  imageUrl: z.string(),
  actions: z.array(
    z.object({
      action: z.enum(['postback', 'url', 'say']),
      label: z.string().min(1),
      value: z.string().min(1),
    })
  ),
})

const defaults = {
  ...messages.defaults,
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
