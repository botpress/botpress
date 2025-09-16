import { z } from '@botpress/sdk'
import { E164_REGEX, LOCALE_REGEX } from './regex'

/** Profile Schemas */

export const profileIdSchema = z.string().title('Profile ID').describe('The unique (Klaviyo) identifier of the profile')
export const phoneSchema = z
  .string()
  .regex(E164_REGEX, 'Must be E.164 format (e.g. +15005550006)')
  .title('Phone number')
  .describe('The phone number of the profile (E.164 format)')
  .optional()
export const emailSchema = z.string().email().title('Email address').describe('The email of the profile').optional()
export const firstNameSchema = z.string().title('First name').describe('The first name of the profile').optional()
export const lastNameSchema = z.string().title('Last name').describe('The last name of the profile').optional()
export const profileSchema = z
  .object({
    id: profileIdSchema,
    email: emailSchema,
    phone: phoneSchema,
    firstName: firstNameSchema,
    lastName: lastNameSchema,
  })
  .title('Profile')
export const localeSchema = z
  .string()
  .regex(LOCALE_REGEX)
  .title('The locale of the profile')
  .describe('The locale of the profile in the IETF BCP 47 language tag format like (ISO 639-1/2)-(ISO 3166 alpha-2)')
  .optional()
export const locationSchema = z
  .object({
    address1: z.string().title('Address line 1').describe('First line of the address'),
    address2: z.string().title('Address line 2').describe('Second line of the address'),
    city: z.string().title('City').describe('City name'),
    country: z.string().title('Country').describe('Country name'),
    region: z.string().title('Region').describe('State or region'),
    zip: z.string().title('ZIP Code').describe('Postal or ZIP code'),
  })
  .partial()
  .strict()
  .title('Location')
  .describe('Address information for the profile')
  .optional()
export const organizationSchema = z
  .string()
  .title('Organization')
  .describe('The organization or company of the profile')
  .optional()
export const jobTitleSchema = z.string().title('Job title').describe('The job title of the profile').optional()
//TODO: just make it json (like just a body of json) rather than a z.record
export const profilePropertiesSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
  .title('Custom Properties')
  .describe('Custom key-value pairs to store with the profile')
  .optional()

/** Get Profiles Schemas */

export const filterFieldsSchema = z
  .enum(['id', 'email', 'phone_number', 'external_id', 'created', 'updated'])
  .title('Filter Field')
  .describe('The field to filter on')
export const filterOperatorsSchema = z
  .enum([
    'equals',
    'greater-than',
    'less-than',
    'greater-or-equal',
    'less-or-equal',
    'contains',
    'starts-with',
    'ends-with',
  ])
  .title('Filter Operator')
  .describe('The comparison operator to use')
export const filterValueSchema = z
  .union([z.string(), z.date()])
  .title('Filter Value')
  .describe('The value to compare against')
export const pageSizeSchema = z
  .number()
  .int()
  .min(1)
  .max(100)
  .title('Page Size')
  .describe('Number of profiles to return per page (1-100, default: 20)')
  .optional()
export const sortingOptionsSchema = z
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
  .optional()

/** Subscription Schemas */

const profileSubscriptionSchema = z.object({
  id: profileIdSchema,
  email: emailSchema,
  phone: phoneSchema,
  emailConsent: z.boolean().title('Email Consent').describe('Whether the profile has consented to email'),
  smsConsent: z.boolean().title('Phone Consent').describe('Whether the profile has consented to SMS'),
})
export const profileSubscriptionsSchema = z
  .array(profileSubscriptionSchema)
  .title('Profile Subscriptions')
  .describe('The list of profiles and Email/SMS consent to use to subscribe Email/SMS marketing')
