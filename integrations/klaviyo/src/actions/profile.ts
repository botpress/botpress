import { RuntimeError } from '@botpress/sdk'
import { ProfileCreateQuery, ProfilePartialUpdateQuery, ProfileEnum } from 'klaviyo-api'
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
      profileId: result.body.data.id || '',
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
      profileId: result.body.data.id || '',
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
