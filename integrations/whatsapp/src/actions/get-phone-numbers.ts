import { getAccessToken, getWabaId, MetaOauthClient } from '../auth'
import * as bp from '.botpress'

export const getPhoneNumbers: bp.IntegrationProps['actions']['getPhoneNumbers'] = async ({ client, ctx, logger }) => {
  const accessToken = await getAccessToken(client, ctx)
  const wabaId = await getWabaId(client, ctx)

  const oauthClient = new MetaOauthClient(logger)
  const numbers = await oauthClient.getWhatsappNumbersFromBusiness(wabaId, accessToken)

  return {
    phoneNumbers: numbers.map(({ id, displayPhoneNumber }) => ({ id, displayPhoneNumber })),
  }
}
