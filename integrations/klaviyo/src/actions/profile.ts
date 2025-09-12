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
import { ProfileAttributes } from './types'

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
  } catch (error: any) {
    logger.forBot().error('Failed to create Klaviyo profile', error)

    if (error.response?.data?.errors) {
      const errorMessages = error.response.data.errors.map((err: any) => err.detail).join(', ')
      throw new RuntimeError(`Klaviyo API error: ${errorMessages}`)
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
  } catch (error: any) {
    logger.forBot().error('Failed to update Klaviyo profile', error)
    if (error.response?.data?.errors) {
      const errorMessages = error.response.data.errors.map((err: any) => err.detail).join(', ')
      throw new RuntimeError(`Klaviyo API error: ${errorMessages}`)
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
  } catch (error: any) {
    logger.forBot().error('Failed to get Klaviyo profile', error)
    if (error.response?.data?.errors) {
      const errorMessages = error.response.data.errors.map((err: any) => err.detail).join(', ')
      throw new RuntimeError(`Klaviyo API error: ${errorMessages}`)
    }

    throw new RuntimeError('Failed to get profile in Klaviyo')
  }
}

export const bulkSubscribeProfiles: bp.IntegrationProps['actions']['bulkSubscribeProfiles'] = async ({
  ctx,
  logger,
  input,
}) => {
  const { profileSubscriptions, listId, historicalImport } = input

  if (!profileSubscriptions || profileSubscriptions.length === 0) {
    throw new RuntimeError('At least one profile is required to bulk subscribe')
  }
  if (profileSubscriptions.length > 1000) {
    throw new RuntimeError('You can only bulk subscribe up to 1000 profiles at a time')
  }

  try {
    const profilesApi = getProfilesApi(ctx)

    const profilesData = profileSubscriptions.map((p) => {
      const subscriptions: any = {}

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

    const bulkSubscribeProfilesQuery: SubscriptionCreateJobCreateQuery = {
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

    const result = await profilesApi.bulkSubscribeProfiles(bulkSubscribeProfilesQuery)

    return {
      success: result.response.status === 202,
    }
  } catch (error: any) {
    logger.forBot().error('Failed to bulk subscribe Klaviyo profiles', error)
    if (error.response?.data?.errors) {
      const errorMessages = error.response.data.errors.map((err: any) => err.detail).join(', ')
      throw new RuntimeError(`Klaviyo API error: ${errorMessages}`)
    }

    throw new RuntimeError('Failed to bulk subscribe profiles in Klaviyo')
  }
}
