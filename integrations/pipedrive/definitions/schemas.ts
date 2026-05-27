import { z } from '@botpress/sdk'

const basePersonFields = {
  name: z.string().title('Name').describe('The name of the person'),
  owner_id: z.number().optional().title('Owner ID').describe('The ID of the owner of the person'),
  org_id: z
    .number()
    .positive()
    .optional()
    .title('Organization ID')
    .describe('The ID of the organization the person belongs to'),
  emailValue: z.string().optional().title('Email').describe('Email address'),
  emailPrimary: z.boolean().optional().title('Email is Primary').describe('Mark the email as primary'),
  phoneValue: z.string().optional().title('Phone Number').describe('Phone number'),
  phonePrimary: z.boolean().optional().title('Phone is Primary').describe('Mark the phone as primary'),
  visible_to: z.number().optional().title('Visible To').describe('The visibility of the person'),
}

export const addPersonSchema = z.object(basePersonFields)

export const updatePersonSchema = z.object({
  person_id: z.number().title('Person ID').describe('The ID of the person to update'),
  ...basePersonFields,
  name: z.string().optional().title('Name').describe('The name of the person'),
})

export const findPersonSchema = z.object({
  term: z.string().min(2).title('Search Term').describe('The search term to look for (minimum 2 characters)'),
  fields: z
    .enum(['custom_fields', 'email', 'notes', 'phone', 'name'])
    .optional()
    .title('Fields to Search')
    .describe('Which fields to search in (custom_fields, email, notes, phone, name)'),
  organization_id: z.number().optional().title('Organization ID').describe('The ID of the organization to search in'),
  exact_match: z.boolean().optional().title('Exact Match').describe('Whether to search for exact matches only'),
})

export const upsertPersonOutputSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  owner_id: z.number().optional(),
  org_id: z.number().nullable().optional(),
  add_time: z.string().nullable().optional(),
  update_time: z.string().nullable().optional(),
  emails: z
    .array(
      z.object({
        value: z.string().optional(),
        primary: z.boolean().optional(),
        label: z.string().optional(),
      })
    )
    .optional(),
  phones: z
    .array(
      z.object({
        value: z.string().optional(),
        primary: z.boolean().optional(),
        label: z.string().optional(),
      })
    )
    .optional(),
  is_deleted: z.boolean().optional(),
  visible_to: z.number().optional(),
  label_ids: z.array(z.number()).optional(),
  picture_id: z.number().nullable().optional(),
  postal_address: z
    .object({
      street_number: z.string().optional(),
      route: z.string().optional(),
      sublocality: z.string().optional(),
      locality: z.string().optional(),
      admin_area_level_1: z.string().optional(),
      admin_area_level_2: z.string().optional(),
      country: z.string().optional(),
      postal_code: z.string().optional(),
      formatted_address: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
  im: z
    .array(
      z.object({
        protocol: z.string().optional(),
        value: z.string().optional(),
      })
    )
    .optional(),
  birthday: z.string().optional(),
  job_title: z.string().optional(),
})

export const searchPersonOutputSchema = z.object({
  result_score: z.number().optional(),
  item: z
    .object({
      id: z.number().optional(),
      type: z.string().optional(),
      name: z.string().optional(),
      phones: z.array(z.string()).optional(),
      emails: z.array(z.string()).optional(),
      visible_to: z.number().optional(),
      owner: z
        .object({
          id: z.number().optional(),
          name: z.string().optional(),
          email: z.string().optional(),
        })
        .optional(),
      organization: z
        .object({
          id: z.number().optional(),
          name: z.string().optional(),
        })
        .optional(),
      custom_fields: z.array(z.string()).optional(),
      notes: z.array(z.string()).optional(),
    })
    .optional(),
})
