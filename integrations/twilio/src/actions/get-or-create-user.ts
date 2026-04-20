import * as sdk from '@botpress/sdk'
import * as bp from '../../.botpress'
import { getTwilioClient } from '../twilio'

export const getOrCreateUser: bp.IntegrationProps['actions']['getOrCreateUser'] = async ({ client, ctx, input }) => {
  const userPhone = input.user.userPhone
  if (!userPhone) {
    throw new sdk.RuntimeError('Could not create a user: missing channel or userId')
  }

  const twilioClient = getTwilioClient(ctx)
  const phone = await twilioClient.lookups.phoneNumbers(userPhone).fetch()

  const { user } = await client.getOrCreateUser({ tags: { userPhone: phone.phoneNumber } })

  return { userId: user.id }
}
