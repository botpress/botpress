import { z } from '@botpress/sdk'

export const formSchema = z.object({
  name: z.string().optional().describe('The name of the form').title('Form Name'),
  siteId: z.string().describe('The ID of the site that the form was submitted from').title('Site ID'),
  data: z.record(z.string()).optional().describe('The data submitted in the form').title('Form Data'),
  schema: z
    .array(
      z.object({
        fieldName: z.string().optional().describe('Form field name').title('Field Name'),
        fieldType: z
          .enum(['FormTextInput', 'FormTextarea', 'FormCheckboxInput', 'FormRadioInput', 'FormFileUploadInput'])
          .optional()
          .describe('Form field type')
          .title('Field Type'),
        fieldElementId: z.string().describe('Element ID of the Form Field').title('Field Element ID'),
      })
    )
    .optional()
    .describe('A list of fields from the submitted form')
    .title('Form Schema'),
  submittedAt: z.string().optional().describe('The timestamp the form was submitted').title('Submitted At'),
  id: z.string().describe('the ID of the event').title('Form Submission ID'),
  formId: z.string().describe('The ID of the form submission').title('Form ID'),
  formElementId: z.string().describe('The uniqueID of the Form element').title('Form Element ID'),
})

export const siteSchema = z.object({
  domain: z.array(z.string()).optional().describe('The domains that were published').title('Site Domain'),
  site: z.string().optional().describe('The ID of the site that was published').title('Site Name'),
  publishedOn: z.string().describe('Timestamp when the site was published').title('Published On'),
  publishedBy: z
    .object({
      displayName: z.string().describe('The name andID of the user who published the site').title('Published By'),
    })
    .describe('Information about the user who published the site')
    .title('Published By'),
})

export const pageSchema = z.object({
  siteId: z.string().describe('ID of the site').title('Site ID'),
  pageId: z.string().describe('ID of the page').title('Page ID'),
  pageTitle: z.string().optional().describe('Title of the page').title('Page Title'),
  createdOn: z.string().optional().describe('Timestamp when the page was created').title('Created On'),
  lastUpdated: z.string().optional().describe('Timestamp when the page was last updated').title('Last Updated'),
  deletedOn: z.string().optional().describe('Timestamp when the page was deleted').title('Deleted On'),
  publishedPath: z.string().optional().describe('Published path of the page').title('Published Path'),
})

export const itemSchema = z.object({
  id: z.string().describe('Unique identifier for the Item').title('Item ID'),
  workspaceId: z.string().describe('Unique identifier of the workspace').title('Workspace ID'),
  siteId: z.string().describe('Unique identifier of the site').title('Site ID'),
  collectionId: z.string().describe('Unique identifier of the collection').title('Collection ID'),
  fieldData: z
    .object({
      name: z.string().describe('Name of the item').title('Item Name'),
      slug: z.string().describe('Slug of the item').title('Item Slug'),
    })
    .describe('Field data of the item')
    .title('Field Data'),
  lastPublished: z
    .string()
    .nullable()
    .optional()
    .describe('Timestamp when the item was last published')
    .title('Last Published'),
  lastUpdated: z.string().optional().describe('Timestamp when the item was last updated').title('Last Updated'),
  createdOn: z.string().optional().describe('Timestamp when the item was created').title('Created On'),
  isArchived: z.boolean().optional().describe('Whether the item is archived').title('Is Archived'),
  isDraft: z.boolean().optional().describe('Whether the item is a draft').title('Is Draft'),
  cmsLocaleId: z
    .string()
    .nullable()
    .optional()
    .describe('Unique identifier of the CMS locale for this item')
    .title('CMS Locale ID'),
})

export const commentSchema = z.object({
  threadId: z.string().describe('Unique identifier for the comment thread').title('Thread ID'),
  commentId: z.string().describe('Unique identifier for the comment reply').title('Comment ID'),
  type: z.string().describe('The type of comment payload').title('Comment Type'),
  siteId: z.string().describe('The site unique identifier').title('Site ID'),
  pageId: z.string().describe('The page unique identifier').title('Page ID'),
  localeId: z.string().describe('The locale unique identifier').title('Locale ID'),
  breakpoint: z.string().describe('The breakpoint the comment was left on').title('Breakpoint'),
  url: z.string().describe('The URL of the page the comment was left on').title('Comment URL'),
  content: z.string().describe('The content of the comment reply').title('Comment Content'),
  isResolved: z.boolean().describe('Boolean determining if the comment thread is resolved').title('Is Resolved'),
  author: z
    .object({
      userId: z.string().describe('The unique identifier of the author').title('Author ID'),
      email: z.string().describe('Email of the author').title('Author Email'),
      name: z.string().describe('Name of the author').title('Author Name'),
    })
    .describe('Information about the author of the comment')
    .title('Author'),
  mentionedUsers: z
    .array(
      z.object({
        userId: z.string().describe('The unique identifier of the mentioned user').title('Mentioned User ID'),
        email: z.string().describe('Email of the user').title('Mentioned User Email'),
        name: z.string().describe('Name of the user').title('Mentioned User Name'),
      })
    )
    .describe(
      'List of mentioned users. This is an empty array until email notifications are sent, which can take up to 5 minutes after the comment is created.'
    )
    .title('Mentioned Users'),
  createdOn: z.string().describe('The date the item was created').title('Created On'),
  lastUpdated: z.string().describe('The date the item was last updated').title('Last Updated'),
})
