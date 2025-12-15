import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const getLabel = {
  title: 'Get Label',
  description: 'Gets the specified label by its ID.',
  input: {
    schema: z.object({
      id: z.string().title('Label ID').describe('The ID of the label to retrieve.'),
    }),
  },
  output: {
    schema: z.object({
      id: z.string().optional().title('Label ID').describe('The immutable ID of the label.'),
      name: z.string().optional().title('Name').describe('The display name of the label.'),
      type: z.string().optional().title('Type').describe('The owner type for the label (system or user).'),
      messageListVisibility: z
        .string()
        .optional()
        .title('Message List Visibility')
        .describe('The visibility of messages with this label in the message list.'),
      labelListVisibility: z
        .string()
        .optional()
        .title('Label List Visibility')
        .describe('The visibility of the label in the label list.'),
      messagesTotal: z
        .number()
        .optional()
        .title('Messages Total')
        .describe('The total number of messages with the label.'),
      messagesUnread: z
        .number()
        .optional()
        .title('Messages Unread')
        .describe('The number of unread messages with the label.'),
      threadsTotal: z
        .number()
        .optional()
        .title('Threads Total')
        .describe('The total number of threads with the label.'),
      threadsUnread: z
        .number()
        .optional()
        .title('Threads Unread')
        .describe('The number of unread threads with the label.'),
      color: z
        .object({
          backgroundColor: z.string().optional().describe('The background color.'),
          textColor: z.string().optional().describe('The text color.'),
        })
        .optional()
        .title('Color')
        .describe('The color to assign to the label.'),
    }),
  },
} as const satisfies ActionDef
