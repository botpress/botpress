import { z } from '@botpress/sdk'

// Raw Freshdesk webhook payload shapes — numeric fields are coerced because
// Freshdesk sends all template values as strings.
export const freshdeskWebhookTicketSchema = z.object({
  id: z.coerce.number(),
  subject: z.string().nullish(),
  status: z.coerce.number().nullish(),
  priority: z.coerce.number().nullish(),
  requester_id: z.coerce.number().nullish(),
  responder_id: z.coerce.number().nullish(),
  group_id: z.coerce.number().nullish(),
  type: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
})

export const freshdeskWebhookReplySchema = z.object({
  body: z.string(),
  body_text: z.string().optional(),
  customer_email: z.string().optional(),
})

const hitlTicketIdSchema = z.object({
  id: z.coerce.number(),
})

const hitlAgentSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String).optional(),
  name: z.string().optional(),
})

export const ticketCreatedBodySchema = z.object({ ticket: freshdeskWebhookTicketSchema })
export const ticketUpdatedBodySchema = z.object({ ticket: freshdeskWebhookTicketSchema })
export const ticketRepliedBodySchema = z.object({
  ticket: freshdeskWebhookTicketSchema,
  reply: freshdeskWebhookReplySchema,
})
export const hitlMessageReceivedBodySchema = z.object({
  ticket: hitlTicketIdSchema,
  reply: z.object({
    body_text: z.string(),
  }),
  agent: hitlAgentSchema,
})
export const hitlAssignedBodySchema = z.object({
  ticket: hitlTicketIdSchema,
  agent: hitlAgentSchema,
})
export const hitlStoppedBodySchema = z.object({ ticket: hitlTicketIdSchema })
