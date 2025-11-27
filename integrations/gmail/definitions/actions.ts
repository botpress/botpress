import * as sdk from '@botpress/sdk'
const { z } = sdk

type ActionDefinitions = NonNullable<sdk.IntegrationDefinitionProps['actions']>
type ActionDef = ActionDefinitions[string]

const listMessages = {
  title: 'List Messages',
  description: "Lists messages in the user's mailbox. Supports Gmail search query syntax for filtering.",
  input: {
    schema: z.object({
      query: z
        .string()
        .optional()
        .title('Query')
        .describe(
          'Gmail search query string (e.g., "from:example@gmail.com", "subject:meeting", "is:unread"). See Gmail search syntax for more options.'
        ),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .default(50)
        .title('Max Results')
        .describe('Maximum number of messages to return. Default is 50, maximum is 500.'),
      pageToken: z
        .string()
        .optional()
        .title('Page Token')
        .describe('Page token to retrieve a specific page of results from the previous list call.'),
    }),
  },
  output: {
    schema: z.object({
      messages: z
        .array(
          z.object({
            id: z.string().title('Message ID').describe('The immutable ID of the message.'),
            threadId: z.string().title('Thread ID').describe('The ID of the thread the message belongs to.'),
          })
        )
        .optional()
        .title('Messages')
        .describe('List of messages matching the query.'),
      nextPageToken: z
        .string()
        .optional()
        .title('Next Page Token')
        .describe('Token to retrieve the next page of results. Use this in the next listMessages call.'),
      resultSizeEstimate: z
        .number()
        .optional()
        .title('Result Size Estimate')
        .describe('Estimated total number of results.'),
    }),
  },
} as const satisfies ActionDef

export const actions = {
  listMessages,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
