import { RuntimeError } from '@botpress/sdk'
import {
  ProfileCreateQuery,
  ProfilePartialUpdateQuery,
  ProfileEnum,
  SubscriptionCreateJobCreateQuery,
  ProfileSubscriptionBulkCreateJobEnum,
} from 'klaviyo-api'
import * as bp from '.botpress'
import { getProfilesApi } from '../auth'
import { ProfileAttributes, ProfileSubscriptions } from './types'
import { isKlaviyoErrorResponse, extractKlaviyoMessage } from './error-handler'

export const createProfile: bp.IntegrationProps['actions']['createProfile'] = async ({ ctx, logger, input }) => {
  const { email, phone, firstName, lastName, organization, title, locale, location } = input

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
    logger.forBot().error('Failed to create Klaviyo profile', error)

    if (typeof error === 'object' && error && isKlaviyoErrorResponse(error)) {
      const msg = extractKlaviyoMessage(error.response.data.errors)
      throw new RuntimeError(`Klaviyo API error: ${msg}`)
    }

    throw new RuntimeError('Failed to create profile in Klaviyo')
  }
}

export const updateProfile: bp.IntegrationProps['actions']['updateProfile'] = async ({ ctx, logger, input }) => {
  const { profileId, email, phone, firstName, lastName, organization, title, locale, location } = input

  if (!profileId) {
    throw new RuntimeError('Klaviyo Profile ID is require to update a profile')
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
    logger.forBot().error('Failed to update Klaviyo profile', error)

    if (typeof error === 'object' && error && isKlaviyoErrorResponse(error)) {
      const msg = extractKlaviyoMessage(error.response.data.errors)
      throw new RuntimeError(`Klaviyo API error: ${msg}`)
    }

    throw new RuntimeError('Failed to update profile in Klaviyo')
  }
}

export const getProfile: bp.IntegrationProps['actions']['getProfile'] = async ({ ctx, logger, input }) => {
  const { profileId } = input

  if (!profileId) {
    throw new RuntimeError('Klaviyo Profile ID is require to get a profile')
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
    logger.forBot().error('Failed to get Klaviyo profile', String(error))

    if (typeof error === 'object' && error && isKlaviyoErrorResponse(error)) {
      const msg = extractKlaviyoMessage(error.response.data.errors)
      throw new RuntimeError(`Klaviyo API error: ${msg}`)
    }

    throw new RuntimeError('Failed to get profile in Klaviyo')
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
  if (profileSubscriptions.length > 1000) {
    throw new RuntimeError('You can only subscribe up to 1000 profiles at a time')
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
    logger.forBot().error('Failed to subscribe Klaviyo profiles', error)

    if (typeof error === 'object' && error && isKlaviyoErrorResponse(error)) {
      const msg = extractKlaviyoMessage(error.response.data.errors)
      throw new RuntimeError(`Klaviyo API error: ${msg}`)
    }

    throw new RuntimeError('Failed to subscribe profiles in Klaviyo')
  }
}
