import { IntegrationDefinitionProps, z } from '@botpress/sdk'

export type WebflowEvent = {
  triggerType: string
  payload: unknown
}

export const itemSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  siteId: z.string(),
  collectionId: z.string(),
  fieldData: z.object({
    name: z.string(),
    slug: z.string(),
  }),
  lastPublished: z.string().nullable(),
  lastUpdated: z.string(),
  createdOn: z.string(),
  isArchived: z.boolean(),
  isDraft: z.boolean(),
  cmsLocaleId: z.string().optional(),
})

export const userSchema = z.object({
  id: z.string(),
  isEmailVerified: z.boolean(),
  lastUpdated: z.string(),
  createdOn: z.string(),
  accessGroups: z.array(z.object({ slug: z.string(), type: z.string() })),
  data: z.object({
    'accept-communications': z.boolean(),
    email: z.string(),
    name: z.string(),
    'accept-privacy': z.string(),
  }),
})

export const pageSchema = z.object({
  siteId: z.string(),
  pageId: z.string(),
  pageTitle: z.string(),
  createdOn: z.string().optional(),
  lastUpdated: z.string().optional(),
  deletedOn: z.string().optional(),
  publishedPath: z.string(),
})

export const siteSchema = z.object({
  domain: z.array(z.string()),
  site: z.string(),
  publishedOn: z.string(),
  publishedBy: z.object({
    displayName: z.string(),
  }),
})

export const formSchema = z.object({
  name: z.string(),
  siteId: z.string(),
  data: z.object({
    'First Name': z.string(),
    'Last Name': z.string(),
    email: z.string(),
    'Phone Number': z.number(),
  }),
  schema: z.array(
    z.object({
      fieldName: z.string(),
      fieldType: z.string(),
      fieldElementId: z.string(),
    })
  ),
  submittedAt: z.string(),
  id: z.string(),
  formId: z.string(),
  formElementId: z.string(),
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
  userAccountAdded: {
    title: '',
    description: '',
    schema: userSchema,
  },
  userAccountUpdated: {
    title: '',
    description: '',
    schema: userSchema,
  },
  userAccountDeleted: {
    title: '',
    description: '',
    schema: userSchema,
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
  sitePublish: {
    title: '',
    description: '',
    schema: siteSchema,
  },
  formSubmission: {
    title: '',
    description: '',
    schema: formSchema,
  },
  commentCreated: {
    title: '',
    description: '',
    schema: commentSchema,
  },
} satisfies IntegrationDefinitionProps['events']
