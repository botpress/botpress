import { z } from '@botpress/sdk'

export namespace Page {
  const _fields = {
    id: z.string().title('ID').describe('The ID of the page.'),
    title: z.string().title('Title').describe('The title of the page.'),
    status: z
      .enum(['current', 'draft', 'archived', 'historical', 'trashed', 'any', 'deleted'])
      .title('Status')
      .describe('The status of the page.'),
    spaceId: z.string().title('Space ID').describe('The ID of the space the page is in.'),
    parentId: z
      .string()
      .title('Parent ID')
      .describe('ID of the parent page, or null if there is no parent page.')
      .nullable(),
    parentType: z
      .enum(['page', 'whiteboard', 'database', 'embed', 'folder'])
      .title('Parent Type')
      .describe('Content type of the parent, or null if there is no parent.')
      .nullable(),
    position: z
      .number()
      .title('Position')
      .describe('Position of child page within the given parent page tree.')
      .nullable(),
    authorId: z.string().title('Author ID').describe('The account ID of the user who created this page originally.'),
    ownerId: z.string().title('Owner ID').describe('The account ID of the user who owns this page.').nullable(),
    lastOwnerId: z
      .string()
      .title('Last Owner ID')
      .describe('The account ID of the user who last edited this page.')
      .nullable(),
    createdAt: z
      .string()
      .title('Created At')
      .describe("Date and time when the page was created. In format 'YYYY-MM-DDTHH:mm:ss.sssZ'."),
    body: z.object({
      atlas_doc_format: z.object({
        value: z.string().title('Value').describe('The content of the page.'),
        representation: z.string().title('Representation').describe('The representation of the content.'),
      }),
    }),
    version: z.object({
      createdAt: z.string().title('Created At').describe('The creation date of the version.'),
      number: z.number().title('number').describe('Represents the version number.'),
      authorId: z.string().title('Author ID').describe('The account ID of the user who created this version.'),
      minorEdit: z.boolean().title('Minor Edit').describe('Indicates whether this version is a minor edit or not.'),
    }),
    _links: z.object({
      webui: z.string().title('Web UI').describe('Web UI link of the content.'),
      editui: z.string().title('Self').describe('Edit UI link of the content.'),
      tinyui: z.string().title('Self').describe('Web UI link of the content.'),
    }),
  } as const

  export const schema = z.object(_fields)
  export type InferredType = z.infer<typeof schema>
}
