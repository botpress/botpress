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
  tags: z
    .union([z.array(z.string()), z.string()])
    .nullish()
    .transform((tags) => {
      if (Array.isArray(tags)) return tags
      if (typeof tags === 'string') {
        return tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      }
      return undefined
    }),
})

const hitlAgentSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String).optional(),
  name: z.string().optional(),
})

const hitlMessageBodySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String).optional(),
  body_text: z
    .string()
    .transform((raw) => {
      const text = raw.replace(/^[^<]+:\s*(?=<)/, '')
      // freshdesk prepends "Agent Name : " before response, trim that
      if (!/<[a-z]/i.test(text)) return text.trim()

      // strip html from the response body
      return text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/​/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    })
    .optional(),
})

export const ticketCreatedBodySchema = z.object({ ticket: freshdeskWebhookTicketSchema })
export const ticketUpdatedBodySchema = z.object({ ticket: freshdeskWebhookTicketSchema })
export const ticketRepliedBodySchema = z.object({
  ticket: freshdeskWebhookTicketSchema,
  reply: freshdeskWebhookReplySchema,
})
export const hitlMessageReceivedBodySchema = z.object({
  ticket: hitlTicketIdSchema,
  reply: hitlMessageBodySchema.optional(),
  note: hitlMessageBodySchema.optional(),
  agent: hitlAgentSchema.optional(),
})
export const hitlAssignedBodySchema = z.object({
  ticket: hitlTicketIdSchema,
  agent: hitlAgentSchema.optional(),
})
export const hitlStoppedBodySchema = z.object({ ticket: hitlTicketIdSchema })
