import { GoogleClient } from './google-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx }) => {
  const googleClient =
    ctx.configurationType === 'customApp'
      ? await GoogleClient.createFromAuthorizationCode({
          client,
          ctx,
          authorizationCode: ctx.configuration.oauthAuthorizationCode,
        })
      : await GoogleClient.create({ client, ctx })

  await googleClient.watchIncomingMail()
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}
