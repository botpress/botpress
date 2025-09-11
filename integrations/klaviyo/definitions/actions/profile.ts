import { z } from '@botpress/sdk'

// E.164 phone number format: a "+" followed by 2-15 digits total, no leader zero
const E164_REGEX = /^\+[1-9]\d{1,14}$/
// IETF BCP 47 tags: language-country, where Language is ISO 639-1/2 (2-3 letters, lowercase) and counter is ISO 3166 alpha-2 (2 letters, uppercase)
const LOCALE_REGEX = /^[a-z]{2,3}-[A-Z]{2}$/

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

//the main schema for the profile: intended to be the primary fields we'd want for context
const profileSchema = z.object({
  id: z.string().title('Profile ID').describe('The unique (Klaviyo) identifier of the profile'),
  email: z.string().email().title('Email address').describe('The email of the profile').optional(),
  phone: z.string().optional().title('Phone').describe('The phone number of the profile'),
  firstName: z.string().optional().title('First Name').describe('The first name of the profile'),
  lastName: z.string().optional().title('Last Name').describe('The last name of the profile'),
})

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
    }),
  },
  // TODO: i think it merits a discussion on what to include in the output schema
  output: {
    schema: z.object({
      profile: profileSchema.title('Profile').describe('The updated profile'),
    }),
  },
}

//TODO: there is both a getProfile and getProfiles endpoint - the latter can be used to get all profiles and can sort by email, phone number, created at, name, etc.
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

export const actions = {
  createProfile,
  updateProfile,
  getProfile,
} as const
