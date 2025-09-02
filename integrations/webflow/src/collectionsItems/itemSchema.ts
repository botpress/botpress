import { z } from '@botpress/sdk'

export const itemSchemaOutput = z.object({
  id: z.string().optional().describe('Unique identifier for the Item'),
  lastPublished: z.string().nullable().describe('The date the item was last published'),
  lastUpdated: z.string().optional().describe('The date the item was last updated'),
  createdOn: z.string().optional().describe('The date the item was created'),
  fieldData: z
    .object({
      name: z.string().min(1, 'Field name is required').describe('Name of the Item'),
      slug: z
        .string()
        .describe(
          'URL structure of the Item in your site. Note: Updates to an item slug will break all links referencing the old slug.'
        ),
    })
    .describe('The field data of your Webflow item'),
  cmsLocaleId: z.string().optional().describe('Identifier for the locale of the CMS item'),
  isArchived: z.boolean().optional().describe('Boolean determining if the Item is set to archived'),
  isDraft: z.boolean().optional().describe('Boolean determining if the Item is set to draft'),
})

export const itemSchemaInput = z.object({
  id: z.string().optional().describe('Unique identifier for the Item'),
  fieldData: z.object({
    name: z.string().min(1, 'Field name is required').describe('Name of the Item'),
    slug: z
      .string()
      .describe(
        'URL structure of the Item in your site. Note: Updates to an item slug will break all links referencing the old slug.'
      ),
  }),
  cmsLocaleId: z.string().optional().describe('Identifier for the locale of the CMS item'),
  isArchived: z.boolean().optional().describe('Boolean determining if the Item is set to archived'),
  isDraft: z.boolean().optional().describe('Boolean determining if the Item is set to draft'),
})

export const paginationSchema = z.object({
  limit: z.number().default(100).optional().describe('The number of items to return'),
  offset: z.number().default(0).optional().describe('The number of items to skip'),
})
