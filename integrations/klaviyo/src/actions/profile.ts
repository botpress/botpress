import { RuntimeError } from '@botpress/sdk'
import {
  ProfileCreateQuery,
  ProfilePartialUpdateQuery,
  ProfileEnum,
  SubscriptionCreateJobCreateQuery,
  ProfileSubscriptionBulkCreateJobEnum,
  FilterBuilder,
} from 'klaviyo-api'
import { getProfilesApi } from '../auth'
import { handleKlaviyoError } from './error-handler'
import { ProfileAttributes, ProfileSubscriptions, GetProfilesOptions } from './types'
import { MAX_PROFILES_PER_BULK_OPERATION } from './constants'
import * as bp from '.botpress'

export const createProfile: bp.IntegrationProps['actions']['createProfile'] = async ({ ctx, logger, input }) => {
  const { email, phone, firstName, lastName, organization, title, locale, location, properties } = input

  if (!email && !phone) {
    throw new RuntimeError('Either email or phone is required to create a profile')
  }

  try {
    const profilesApi = getProfilesApi(ctx)

    const profileAttributes: ProfileAttributes = {}

    if (email) profileAttributes.email = email
    if (phone) profileAttributes.phoneNumber = phone
    if (firstName) profileAttributes.firstName = firstName
    if (lastName) profileAttributes.lastName = lastName
    if (organization) profileAttributes.organization = organization
    if (title) profileAttributes.title = title
    if (locale) profileAttributes.locale = locale
    if (location) {
      profileAttributes.location = {
        address1: location.address1,
        address2: location.address2,
        city: location.city,
        country: location.country,
        region: location.region,
        zip: location.zip,
      }
    }
    if (properties) {
      profileAttributes.properties = properties
    }

    const profileQuery: ProfileCreateQuery = {
      data: {
        type: ProfileEnum.Profile,
        attributes: profileAttributes,
      },
    }

    const result = await profilesApi.createProfile(profileQuery)

    return {
      profile: {
        id: result.body.data.id || '',
        email: result.body.data.attributes.email || undefined,
        phone: result.body.data.attributes.phoneNumber || undefined,
        firstName: result.body.data.attributes.firstName || undefined,
        lastName: result.body.data.attributes.lastName || undefined,
      },
    }
  } catch (error) {
    handleKlaviyoError(error, 'Failed to create profile in Klaviyo', logger, 'Failed to create Klaviyo profile')
  }
}

export const updateProfile: bp.IntegrationProps['actions']['updateProfile'] = async ({ ctx, logger, input }) => {
  const { profileId, email, phone, firstName, lastName, organization, title, locale, location, properties } = input

  if (!profileId) {
    throw new RuntimeError('Klaviyo Profile ID is required to update a profile')
  }

  try {
    const profilesApi = getProfilesApi(ctx)

    const updatedProfileAttributes: ProfileAttributes = {}

    if (email) updatedProfileAttributes.email = email
    if (phone) updatedProfileAttributes.phoneNumber = phone
    if (firstName) updatedProfileAttributes.firstName = firstName
    if (lastName) updatedProfileAttributes.lastName = lastName
    if (organization) updatedProfileAttributes.organization = organization
    if (title) updatedProfileAttributes.title = title
    if (locale) updatedProfileAttributes.locale = locale
    if (location) {
      updatedProfileAttributes.location = {
        address1: location.address1,
        address2: location.address2,
        city: location.city,
        country: location.country,
        region: location.region,
        zip: location.zip,
      }
    }
    if (properties) {
      updatedProfileAttributes.properties = properties
    }

    const updatedProfileQuery: ProfilePartialUpdateQuery = {
      data: {
        type: ProfileEnum.Profile,
        id: profileId,
        attributes: updatedProfileAttributes,
      },
    }

    const result = await profilesApi.updateProfile(profileId, updatedProfileQuery)

    return {
      profile: {
        id: result.body.data.id || '',
        email: result.body.data.attributes.email || undefined,
        phone: result.body.data.attributes.phoneNumber || undefined,
        firstName: result.body.data.attributes.firstName || undefined,
        lastName: result.body.data.attributes.lastName || undefined,
      },
    }
  } catch (error) {
    handleKlaviyoError(error, 'Failed to update profile in Klaviyo', logger, 'Failed to update Klaviyo profile')
  }
}

export const getProfile: bp.IntegrationProps['actions']['getProfile'] = async ({ ctx, logger, input }) => {
  const { profileId } = input

  if (!profileId) {
    throw new RuntimeError('Klaviyo Profile ID is required to get a profile')
  }

  try {
    const profilesApi = getProfilesApi(ctx)

    const result = await profilesApi.getProfile(profileId)

    return {
      profile: {
        id: result.body.data.id || '',
        email: result.body.data.attributes.email || undefined,
        phone: result.body.data.attributes.phoneNumber || undefined,
        firstName: result.body.data.attributes.firstName || undefined,
        lastName: result.body.data.attributes.lastName || undefined,
      },
    }
  } catch (error) {
    handleKlaviyoError(error, 'Failed to get profile in Klaviyo', logger, 'Failed to get Klaviyo profile')
  }
}

const toDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    return value
  }
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`)
  }
  return date
}

/**
 * Returns the filter string (e.g. filterBuilder.equals('email', 'test@test.com').build() => "equals(email, test@test.com)")
 */
const buildFilter = (field: string, operator: string, value: string | Date): string => {
  const filterBuilder = new FilterBuilder()

  switch (operator) {
    case 'equals':
      return filterBuilder.equals(field, value).build()
    case 'greater-than':
      return filterBuilder.greaterThan(field, toDate(value)).build()
    case 'less-than':
      return filterBuilder.lessThan(field, toDate(value)).build()
    case 'greater-or-equal':
      return filterBuilder.greaterOrEqual(field, toDate(value)).build()
    case 'less-or-equal':
      return filterBuilder.lessOrEqual(field, toDate(value)).build()
    case 'contains':
      return filterBuilder.contains(field, value as string).build()
    case 'starts-with':
      return filterBuilder.startsWith(field, value as string).build()
    case 'ends-with':
      return filterBuilder.endsWith(field, value as string).build()
    default:
      throw new Error(`Unsupported filter operator: ${operator}`)
  }
}

export const getProfiles: bp.IntegrationProps['actions']['getProfiles'] = async ({ ctx, logger, input }) => {
  const { filterField, filterOperator, filterValue, pageSize, sort } = input

  try {
    const profilesApi = getProfilesApi(ctx)

    const options: GetProfilesOptions = {}

    if (filterField && filterOperator && filterValue) {
      options.filter = buildFilter(filterField, filterOperator, filterValue)
    }

    if (pageSize) options.pageSize = pageSize
    if (sort) options.sort = sort

    const result = await profilesApi.getProfiles(options)

    const profiles = result.body.data.map((profile: any) => ({
      id: profile.id || '',
      email: profile.attributes.email || undefined,
      phone: profile.attributes.phoneNumber || undefined,
      firstName: profile.attributes.firstName || undefined,
      lastName: profile.attributes.lastName || undefined,
    }))

    return {
      profiles,
      totalCount: result.body.data.length,
    }
  } catch (error) {
    handleKlaviyoError(error, 'Failed to get profiles from Klaviyo', logger, 'Failed to get Klaviyo profiles')
  }
}

export const subscribeProfiles: bp.IntegrationProps['actions']['subscribeProfiles'] = async ({
  ctx,
  logger,
  input,
}) => {
  const { profileSubscriptions, listId, historicalImport } = input

  if (!profileSubscriptions || profileSubscriptions.length === 0) {
    throw new RuntimeError('At least one profile is required to subscribe')
  }
  if (profileSubscriptions.length > MAX_PROFILES_PER_BULK_OPERATION) {
    throw new RuntimeError(`You can only subscribe up to ${MAX_PROFILES_PER_BULK_OPERATION} profiles at a time`)
  }

  try {
    const profilesApi = getProfilesApi(ctx)

    const profilesData = profileSubscriptions.map((p) => {
      const subscriptions: ProfileSubscriptions = {}

      if (p.emailConsent) {
        subscriptions.email = {
          marketing: {
            consent: 'SUBSCRIBED',
            consented_at: historicalImport ? new Date().toISOString() : undefined,
          },
        }
      }

      if (p.smsConsent) {
        subscriptions.sms = {
          marketing: {
            consent: 'SUBSCRIBED',
            consented_at: historicalImport ? new Date().toISOString() : undefined,
          },
        }
      }

      return {
        type: ProfileEnum.Profile,
        ...(p.id && { id: p.id }),
        attributes: {
          ...(p.email && { email: p.email }),
          ...(p.phone && { phone_number: p.phone }),
          subscriptions,
        },
      }
    })

    const subscribeProfilesQuery: SubscriptionCreateJobCreateQuery = {
      data: {
        type: ProfileSubscriptionBulkCreateJobEnum.ProfileSubscriptionBulkCreateJob,
        attributes: {
          profiles: { data: profilesData },
          ...(historicalImport !== undefined && { historical_import: historicalImport }),
        },
        ...(listId && {
          relationships: {
            list: { data: { type: 'list', id: listId } },
          },
        }),
      },
    }

    const result = await profilesApi.bulkSubscribeProfiles(subscribeProfilesQuery)

    return {
      success: result.response.status === 202,
    }
  } catch (error) {
    handleKlaviyoError(error, 'Failed to subscribe profiles in Klaviyo', logger, 'Failed to subscribe Klaviyo profiles')
  }
}
