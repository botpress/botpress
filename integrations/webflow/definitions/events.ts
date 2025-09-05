import { IntegrationDefinitionProps } from '@botpress/sdk'
import { formSchema, siteSchema, pageSchema, itemSchema, commentSchema } from './sub-schemas'

export const events = {
  formSubmission: {
    title: 'Form Submission',
    description: 'Information about a form that was submitted',
    schema: formSchema,
  },
  sitePublish: {
    title: 'Site Publish',
    description: 'Information about a site that was published',
    schema: siteSchema,
  },
  pageCreated: {
    title: 'Page Created',
    description: 'Information about a new pages',
    schema: pageSchema,
  },
  pageMetadataUpdated: {
    title: 'Page Metadata Updated',
    description: "Information about a page's updated metadata and/or settings",
    schema: pageSchema,
  },
  pageDeleted: {
    title: 'Page Deleted',
    description: 'Information about a page that was deleted',
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
    description: 'Information about a collection item that was published',
    schema: itemSchema,
  },
  collectionItemUnpublished: {
    title: 'Collection Item Unpublished',
    description: 'Information about a collection item that was removed from the live site',
    schema: itemSchema,
  },
  // user not supported
  // ecomm not supported
  commentCreated: {
    title: 'New Comment Thread',
    description: 'Information about a new comment thread or reply',
    schema: commentSchema,
  },
} satisfies IntegrationDefinitionProps['events']
