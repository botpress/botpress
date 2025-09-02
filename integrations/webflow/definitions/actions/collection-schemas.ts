import { z } from '@botpress/sdk'

export const fieldTypeSchema = z.enum([
  'Color',
  'DateTime',
  'Email',
  'ExtFileRef',
  'File',
  'Image',
  'Link',
  'Multimage',
  'MultiReference',
  'Number',
  'Option',
  'Phone',
  'PlainText',
  'Reference',
  'RichText',
  'Switch',
  'VideoLink',
])

export const CollectionSchema = z.object({
  id: z.string().optional(),
  displayName: z.string(),
  singularName: z.string(),
  slug: z.string().optional(),
  createdOn: z.string().optional(),
  lastUpdated: z.string().optional(),
})

export const CollectionDetailsSchema = z.object({
  id: z.string().optional(),
  displayName: z.string(),
  singularName: z.string(),
  fields: z.array(
    z.object({
      id: z.string(),
      isRequired: z.boolean(),
      type: fieldTypeSchema,
      displayName: z.string(),
      isEditable: z.boolean().nullable(),
      slug: z.string().nullable(),
      helpText: z.string().nullable(),
      validation: z.any(),
    })
  ),
  slug: z.string().optional(),
  createdOn: z.string().optional(),
  lastUpdated: z.string().optional(),
})
