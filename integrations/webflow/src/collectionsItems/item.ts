import { z } from '@botpress/sdk'

export const itemSchemaOutput = z.object({
  id: z.string().min(1, 'Item ID is required').describe('Unique identifier for the Item'),
  lastPublished: z.date().optional().describe('The date the item was last published'),
  lastUpdated: z.date().optional().describe('The date the item was last updated'),
  createdOn: z.date().optional().describe('The date the item was created'),
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
  cmsLocaleId: z.string().min(1, 'CMS Locale ID is required').describe('Identifier for the locale of the CMS item'),
  isArchived: z.boolean().describe('Boolean determining if the Item is set to archived'),
  isDraft: z.boolean().describe('Boolean determining if the Item is set to draft'),
})

export const itemSchemaInput = z.object({
  fieldData: z.object({
    name: z.string().min(1, 'Field name is required').describe('Name of the Item'),
    slug: z
      .string()
      .describe(
        'URL structure of the Item in your site. Note: Updates to an item slug will break all links referencing the old slug.'
      ),
  }),
  cmsLocaleId: z.string().optional().describe('Identifier for the locale of the CMS item'),
  isArchived: z.boolean().default(false).describe('Boolean determining if the Item is set to archived'),
  isDraft: z.boolean().default(true).describe('Boolean determining if the Item is set to draft'),
})
