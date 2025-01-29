import { z } from '@botpress/sdk'
import { Color } from './color'

// documentation for Project: https://developer.todoist.com/rest/v2/#projects

export namespace Project {
  const _fields = {
    id: z.string().title('ID').describe('The ID of the project.'),
    name: z.string().title('Name').describe('The name of the project.'),
    color: z.enum(Color.names).title('Color Name').describe('The color of the project.'),
    parentProjectId: z
      .string()
      .title('Parent Project ID')
      .optional()
      .describe('The ID of the parent project. Omitted if the project has no parent project.'),
    positionWithinParent: z
      .number()
      .title('Position Within Parent')
      .describe(
        "Numerical index indicating project's order within its parent project (read-only). Will be 0 for inbox projects."
      ),
    numberOfComments: z
      .number()
      .title('Number of Comments')
      .nonnegative()
      .describe('The number of comments on the project.'),
    isShared: z.boolean().title('Is Shared?').describe('Whether the project is shared or not.'),
    isFavorite: z.boolean().title('Is Favorite?').describe('Whether the project is marked as favorite or not.'),
    isInboxProject: z.boolean().title('Is Inbox Project?').describe("Whether the project is the user's inbox."),
    isTeamInbox: z.boolean().title('Is Team Inbox?').describe('Whether the project is a team inbox.'),
    webUrl: z.string().title('Web URL').describe('The URL of the project in the Todoist web app.'),
  } as const

  export const schema = z.object(_fields)
  export type InferredType = z.infer<typeof schema>
}
