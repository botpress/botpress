import { RuntimeError } from '@botpress/sdk'
import { ApiKeySession, ProfilesApi, ProfileCreateQuery, ProfileEnum } from 'klaviyo-api'
import * as bp from '.botpress'

export const createProfile: bp.IntegrationProps['actions']['createProfile'] = async (props) => {
  const { email, phone, firstName, lastName, organization, title, locale, location } = props.input
  const { apiKey } = props.ctx.configuration

  if (!apiKey) {
    throw new RuntimeError('API Key is required for Klaviyo integration')
  }

  // Runtime validation - either email or phone is required
  if (!email && !phone) {
    throw new RuntimeError('Either email or phone is required to create a profile')
  }

  try {
    // Create API key session
    const session = new ApiKeySession(apiKey)
    const profilesApi = new ProfilesApi(session)

    // Build profile attributes
    const profileAttributes: any = {}

    if (email) profileAttributes.email = email
    if (phone) profileAttributes.phone_number = phone
    if (firstName) profileAttributes.first_name = firstName
    if (lastName) profileAttributes.last_name = lastName
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

    // Create profile query
    const profileQuery: ProfileCreateQuery = {
      data: {
        type: ProfileEnum.Profile,
        attributes: profileAttributes,
      },
    }

    // Create the profile
    const result = await profilesApi.createProfile(profileQuery)

    return {
      profileId: result.body.data.id,
      email: result.body.data.attributes.email,
      phone: result.body.data.attributes.phoneNumber,
      firstName: result.body.data.attributes.firstName,
      lastName: result.body.data.attributes.lastName,
    }
  } catch (error: any) {
    props.logger.forBot().error('Failed to create Klaviyo profile', error)

    // Handle specific Klaviyo API errors
    if (error.response?.data?.errors) {
      const errorMessages = error.response.data.errors.map((err: any) => err.detail).join(', ')
      throw new RuntimeError(`Klaviyo API error: ${errorMessages}`)
    }

    throw new RuntimeError('Failed to create profile in Klaviyo')
  }
}
