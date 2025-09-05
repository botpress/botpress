import { IntegrationDefinitionProps, z } from '@botpress/sdk'

export type WebflowEvent = {
  triggerType: string
  payload: unknown
}

export const formSchema = z.object({
  name: z.string().optional(),
  siteId: z.string(),
  data: z
    .object({
      'First Name': z.string(),
      'Last Name': z.string(),
      email: z.string(),
      'Phone Number': z.number(),
    })
    .optional(),
  schema: z
    .array(
      z.object({
        fieldName: z.string().optional(),
        fieldType: z // TODO verifie FormTextarea no majuscule on 'a'
          .enum(['FormTextInput', 'FormTextarea', 'FormCheckboxInput', 'FormRadioInput', 'FormFileUploadInput'])
          .optional(),
        fieldElementId: z.string(),
      })
    )
    .optional(),
  submittedAt: z.string().optional(),
  id: z.string(),
  formId: z.string(),
  formElementId: z.string(),
})

export const siteSchema = z.object({
  domain: z.array(z.string()).optional(),
  site: z.string().optional(),
  publishedOn: z.string(),
  publishedBy: z.object({
    displayName: z.string(),
  }),
})

export const pageSchema = z.object({
  siteId: z.string(),
  pageId: z.string(),
  pageTitle: z.string().optional(),
  createdOn: z.string().optional(),
  lastUpdated: z.string().optional(),
  deletedOn: z.string().optional(),
  publishedPath: z.string().optional(),
})

export const itemSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  siteId: z.string(),
  collectionId: z.string(),
  fieldData: z.object({
    name: z.string(),
    slug: z.string(),
  }),
  lastPublished: z.string().nullable().optional(),
  lastUpdated: z.string().optional(),
  createdOn: z.string().optional(),
  isArchived: z.boolean().optional(),
  isDraft: z.boolean().optional(),
  cmsLocaleId: z.string().nullable().optional(),
})

export const commentSchema = z.object({
  threadId: z.string(),
  commentId: z.string(),
  type: z.string(),
  siteId: z.string(),
  pageId: z.string(),
  localeId: z.string(),
  breakpoint: z.string(),
  url: z.string(),
  content: z.string(),
  isResolved: z.boolean(),
  author: z.object({
    userId: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  mentionedUsers: z.array(
    z.object({
      userId: z.string(),
      email: z.string(),
      name: z.string(),
    })
  ),
  createdOn: z.string(),
  lastUpdated: z.string(),
})

export const events = {
  formSubmission: {
    title: '',
    description: '',
    schema: formSchema,
  },
  sitePublish: {
    title: '',
    description: '',
    schema: siteSchema,
  },
  pageCreated: {
    title: '',
    description: '',
    schema: pageSchema,
  },
  pageMetadataUpdated: {
    title: '',
    description: '',
    schema: pageSchema,
  },
  pageDeleted: {
    title: '',
    description: '',
    schema: pageSchema,
  },
  collectionItemCreated: {
    title: 'Collection Item Created',
    description: 'Information about a new collection item',
    schema: itemSchema,
  },
  collectionItemDeleted: {
    title: 'Collection Item Deleted',
    description: 'Information about a deleted collection item',
    schema: itemSchema,
  },
  collectionItemUpdated: {
    title: 'Collection Item Updated',
    description: 'Information about an updated collection item',
    schema: itemSchema,
  },
  collectionItemPublished: {
    title: 'Collection Item Published',
    description: '',
    schema: itemSchema,
  },
  collectionItemUnpublished: {
    title: 'Collection Item Unpublished',
    description: '',
    schema: itemSchema,
  },
  // user not supported
  // ecomm not supported
  commentCreated: {
    title: '',
    description: '',
    schema: commentSchema,
  },
} satisfies IntegrationDefinitionProps['events']
