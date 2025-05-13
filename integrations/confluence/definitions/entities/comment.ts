import * as sdk from '@botpress/sdk'

const { z } = sdk

export namespace Comment {
  const _fields = {
    id: z.string().title('ID').describe('The ID of the page.'),
    title: z.string().title('Title').describe('The title of the page.'),
    status: z
      .enum(['current', 'draft', 'archived', 'historical', 'trashed', 'any', 'deleted'])
      .title('Status')
      .describe('The status of the page.'),
    pageId: z.string().title('Page ID').describe('The ID of the page.'),
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
      message: z.string().title('Message').describe('The message associated with the current version.'),
    }),
    _links: z.object({
      webui: z.string().title('Web UI').describe('Web UI link of the content.'),
      editui: z.string().title('Edit UI').describe('Edit UI link of the content.'),
      tinyui: z.string().title('Web UI').describe('Web UI link of the content.'),
    }),
  } as const

  export const schema = z.object(_fields)
  export type InferredType = sdk.z.infer<typeof schema>
}
