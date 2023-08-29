import z from 'zod'

export const createConversationInputSchema = z.object({
  agentContextInfo: z
    .string()
    .optional()
    .describe(
      'Overwrite the initial context message when starting the conversation. (Optional) (Default: Agent Context [UserId - Subject - Description])'
    ),
  displayName: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe(
      'A friendly name for the conversation, may be displayed to the business or the user (Optional) (e.g. Marketing)'
    ),
  description: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe(
      'A short text describing the conversation (Optional) (e.g. My Marketing Conversation)'
    ),
  iconUrl: z
    .string()
    .url()
    .min(1)
    .max(2048)
    .optional()
    .describe(
      'A custom conversation icon url. The image must be in either JPG, PNG, or GIF format (Optional) (e.g. https://www.gravatar.com/image.jpg)'
    ),
})

export const createConversationOutputSchema = z
  .object({
    id: z.string().optional(),
  })
  .partial()
