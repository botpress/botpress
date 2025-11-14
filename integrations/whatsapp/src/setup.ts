import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async (props) => {
  const configTypeName = props.ctx.configurationType ? props.ctx.configurationType : 'OAuth'
  props.logger.forBot().debug(`Whatsapp Registration with configurationType ${configTypeName}`)

  // Always make sure a bot is dissociated from WhatsApp conversations once the configuration type changes
  const configureIntegrationProps: Parameters<typeof props.client.configureIntegration>[0] = {
    sandboxIdentifiers: null,
  }
  // Ensure that requests sent to a profile associated with a bot via OAuth are not received by the bot
  if (props.ctx.configurationType !== null) {
    configureIntegrationProps.identifier = null
  }
  await props.client.configureIntegration(configureIntegrationProps)
  if (props.ctx.configurationType !== 'manual') {
    return // nothing more to do if we're not using manual configuration
  }

  const { accessToken, defaultBotPhoneNumberId, verifyToken } = props.ctx.configuration

  // clientSecret is optional and not required for validation
  if (accessToken && defaultBotPhoneNumberId && verifyToken) {
    // let's check the credentials
    const isValidConfiguration = await _checkManualConfiguration(accessToken)
    if (!isValidConfiguration) {
      throw new RuntimeError('Error! Please check your credentials and webhook.')
    }
  } else {
    throw new RuntimeError('Error! Please add the missing fields and save.')
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

async function _checkManualConfiguration(accessToken: string) {
  // get appId first
  const appResponse = await fetch('https://graph.facebook.com/app', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!appResponse.ok) {
    return false // Invalid access token
  }

  const appId = (await appResponse.json()).id

  return !!appId // TODO: check if webhook is configured, this may require a permission change.
}
