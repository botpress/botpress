import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export const getBotpressWebhookUrl = (): string => process.env['BP_WEBHOOK_URL'] ?? ''

export const getSfCredentials = async (client: bp.Client, integrationId: string) => {
  try {
    const {
      state: { payload },
    } = await client.getState({
      type: 'integration',
      name: 'credentials',
      id: integrationId,
    })

    return payload
  } catch {
    throw new sdk.RuntimeError(
      'Salesforce credentials not found. Please log in to your Salesforce account to continue.'
    )
  }
}
