import { getAccessToken, getWabaId, MetaOauthClient } from '../auth'
import { logForBotAndThrow } from '../misc/util'
import * as bp from '.botpress'

export const getBusinessPhoneNumbers: bp.IntegrationProps['actions']['getBusinessPhoneNumbers'] = async ({
  client,
  ctx,
  logger,
}) => {
  if (ctx.configurationType === 'sandbox') {
    logForBotAndThrow('Getting phone numbers is not supported in sandbox mode', logger)
  }
  const accessToken = await getAccessToken(client, ctx)
  const wabaId = await getWabaId(client, ctx)

  const oauthClient = new MetaOauthClient(logger)
  const numbers = await oauthClient.getWhatsappNumbersFromBusiness(wabaId, accessToken)

  return {
    phoneNumbers: numbers.map(({ id, displayPhoneNumber }) => ({ id, displayPhoneNumber })),
  }
}
