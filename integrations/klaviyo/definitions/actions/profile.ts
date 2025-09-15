import { z } from '@botpress/sdk'
import { profileSchema } from './shared'
import { E164_REGEX, LOCALE_REGEX } from './regex'

const locationSchema = z
  .object({
    address1: z.string().title('Address line 1'),
    address2: z.string().title('Address line 2'),
    city: z.string(),
    country: z.string(),
    region: z.string(),
    zip: z.string(),
  })
  .partial()
  .strict()

const createProfile = {
  title: 'Create Profile',
  description: 'Create a profile in Klaviyo: either email or phone is required',
  input: {
    schema: z.object({
      email: z.string().email().title('Email address').describe('The email of the profile').optional(),
      phone: z
        .string()
        .regex(E164_REGEX, 'Must be E.164 format (e.g. +15005550006)')
        .title('Phone number')
        .describe('The phone number of the profile (E.164 format)')
        .optional(),
      firstName: z.string().title('First name').describe('The first name of the profile').optional(),
      lastName: z.string().title('Last name').describe('The last name of the profile').optional(),
      organization: z.string().title('Organization').describe('The organization or company of the profile').optional(),
      title: z.string().title('Job title').describe('The job title of the profile').optional(),
      locale: z
        .string()
        .regex(LOCALE_REGEX)
        .title('The locale of the profile')
        .describe(
          'The locale of the profile in the IETF BCP 47 language tag format like (ISO 639-1/2)-(ISO 3166 alpha-2)'
        )
        .optional(),
      location: locationSchema.optional(),
      properties: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .title('Custom Properties')
        .describe('Custom key-value pairs to store with the profile')
        .optional(),
    }),
  },
  output: {
    schema: z.object({
      profile: profileSchema.title('Profile').describe('The created profile'),
    }),
  },
}

const updateProfile = {
  title: 'Update Profile',
  description: 'Update a profile in Klaviyo',
  input: {
    schema: z.object({
      profileId: z.string().title('Profile ID').describe('The unique (Klaviyo) identifier of the profile'),
      email: z.string().email().title('Email address').describe('The email of the profile').optional(),
      phone: z
        .string()
        .regex(E164_REGEX, 'Must be E.164 format (e.g. +15005550006)')
        .title('Phone number')
        .describe('The phone number of the profile (E.164 format)')
        .optional(),
      firstName: z.string().title('First name').describe('The first name of the profile').optional(),
      lastName: z.string().title('Last name').describe('The last name of the profile').optional(),
      organization: z.string().title('Organization').describe('The organization or company of the profile').optional(),
      title: z.string().title('Job title').describe('The job title of the profile').optional(),
      locale: z
        .string()
        .regex(LOCALE_REGEX)
        .title('The locale of the profile')
        .describe(
          'The locale of the profile in the IETF BCP 47 language tag format like (ISO 639-1/2)-(ISO 3166 alpha-2)'
        )
        .optional(),
      location: locationSchema.optional(),
      properties: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .title('Custom Properties')
        .describe('Custom key-value pairs to store with the profile')
        .optional(),
    }),
  },
  output: {
    schema: z.object({
      profile: profileSchema.title('Profile').describe('The updated profile'),
    }),
  },
}

const getProfile = {
  title: 'Get Profile',
  description: 'Get a profile in Klaviyo',
  input: {
    schema: z.object({
      profileId: z.string().title('Profile ID').describe('The unique (Klaviyo) identifier of the profile'),
    }),
  },
  output: {
    schema: z.object({
      profile: profileSchema.title('Profile').describe('The retrieved profile'),
    }),
  },
}

const filterFields = z.enum(['id', 'email', 'phone_number', 'external_id', 'created', 'updated'])

const filterOperators = z.enum([
  'equals',
  'greater-than',
  'less-than',
  'greater-or-equal',
  'less-or-equal',
  'contains',
  'starts-with',
  'ends-with',
])

const filterValue = z.union([z.string(), z.date()])

const getProfiles = {
  title: 'Get Profiles',
  description: 'Get profiles using filters in Klaviyo',
  input: {
    schema: z.object({
      filterField: filterFields.title('Filter Field').describe('The field to filter on').optional(),
      filterOperator: filterOperators.title('Filter Operator').describe('The comparison operator to use').optional(),
      filterValue: filterValue.title('Filter Value').describe('The value to compare against').optional(),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .title('Page Size')
        .describe('Number of profiles to return per page (1-100, default: 20)')
        .optional(),
      sort: z
        .enum([
          'created',
          '-created',
          'email',
          '-email',
          'id',
          '-id',
          'subscriptions.email.marketing.list_suppressions.timestamp',
          '-subscriptions.email.marketing.list_suppressions.timestamp',
          'subscriptions.email.marketing.suppression.timestamp',
          '-subscriptions.email.marketing.suppression.timestamp',
          'updated',
          '-updated',
        ])
        .title('Sort')
        .describe('Sort profiles by field. Prefix with - for descending order')
        .optional(),
    }),
  },
  output: {
    schema: z.object({
      profiles: z.array(profileSchema).title('Profiles').describe('Array of profiles matching the criteria'),
    }),
  },
}

const profileSubscriptions = z.object({
  id: z.string().title('Profile ID').describe('The unique (Klaviyo) identifier of the profile'),
  email: z.string().email().title('Email address').describe('The email of the profile').optional(),
  phone: z.string().title('Phone').describe('The phone number of the profile').optional(),
  emailConsent: z.boolean().title('Email Consent').describe('Whether the profile has consented to email'),
  smsConsent: z.boolean().title('Phone Consent').describe('Whether the profile has consented to SMS'),
})

const subscribeProfiles = {
  title: 'Subscribe Profiles',
  description: 'Subscribe profiles asynchronously to a SMS and/or email marketing in Klaviyo',
  input: {
    schema: z.object({
      profileSubscriptions: z
        .array(profileSubscriptions)
        .title('Profile Subscriptions')
        .describe('The list of profiles and Email/SMS consent to use to subscribe Email/SMS marketing'),
      listId: z.string().title('List ID').describe('An optional list id to add the subscribed profiles to').optional(),
      historicalImport: z
        .boolean()
        .title('Historical Import')
        .describe('Whether to import historical profiles')
        .optional(),
    }),
  },
  output: {
    schema: z.object({
      success: z
        .boolean()
        .title('Success')
        .describe('Whether the job to subscribe the profiles has been successfully scheduled'),
    }),
  },
}

export const actions = {
  createProfile,
  updateProfile,
  getProfile,
  getProfiles,
  subscribeProfiles,
} as const
