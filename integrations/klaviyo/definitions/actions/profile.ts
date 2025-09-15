import { z } from '@botpress/sdk'
import {
  profileIdSchema,
  profileSchema,
  phoneSchema,
  emailSchema,
  localeSchema,
  locationSchema,
  firstNameSchema,
  lastNameSchema,
  organizationSchema,
  jobTitleSchema,
  profilePropertiesSchema,
  profileSubscriptionsSchema,
  filterFieldsSchema,
  filterOperatorsSchema,
  filterValueSchema,
  pageSizeSchema,
  sortingOptionsSchema,
} from './shared'

const createProfile = {
  title: 'Create Profile',
  description: 'Create a profile in Klaviyo: either email or phone is required',
  input: {
    schema: z.object({
      email: emailSchema,
      phone: phoneSchema,
      firstName: firstNameSchema,
      lastName: lastNameSchema,
      organization: organizationSchema,
      title: jobTitleSchema,
      locale: localeSchema,
      location: locationSchema,
      properties: profilePropertiesSchema,
    }),
  },
  output: {
    schema: z.object({
      profile: profileSchema.describe('The created profile'),
    }),
  },
}

const updateProfile = {
  title: 'Update Profile',
  description: 'Update a profile in Klaviyo',
  input: {
    schema: z.object({
      profileId: profileIdSchema,
      email: emailSchema,
      phone: phoneSchema,
      firstName: firstNameSchema,
      lastName: lastNameSchema,
      organization: organizationSchema,
      title: jobTitleSchema,
      locale: localeSchema,
      location: locationSchema,
      properties: profilePropertiesSchema,
    }),
  },
  output: {
    schema: z.object({
      profile: profileSchema.describe('The updated profile'),
    }),
  },
}

const getProfile = {
  title: 'Get Profile',
  description: 'Get a profile in Klaviyo',
  input: {
    schema: z.object({
      profileId: profileIdSchema,
    }),
  },
  output: {
    schema: z.object({
      profile: profileSchema.describe('The retrieved profile'),
    }),
  },
}

const getProfiles = {
  title: 'Get Profiles',
  description: 'Get profiles using filters in Klaviyo',
  input: {
    schema: z.object({
      filterField: filterFieldsSchema,
      filterOperator: filterOperatorsSchema,
      filterValue: filterValueSchema,
      pageSize: pageSizeSchema,
      sort: sortingOptionsSchema,
    }),
  },
  output: {
    schema: z.object({
      profiles: z.array(profileSchema).title('Profiles').describe('Array of profiles matching the criteria'),
    }),
  },
}

const subscribeProfiles = {
  title: 'Subscribe Profiles',
  description: 'Subscribe profiles asynchronously to a SMS and/or email marketing in Klaviyo',
  input: {
    schema: z.object({
      profileSubscriptions: profileSubscriptionsSchema,
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
