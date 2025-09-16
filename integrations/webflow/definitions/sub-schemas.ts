import { z } from '@botpress/sdk'

export const formSchema = z.object({
  name: z.string().optional(),
  siteId: z.string(),
  data: z.record(z.string()).optional(),
  schema: z
    .array(
      z.object({
        fieldName: z.string().optional(),
        fieldType: z
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
