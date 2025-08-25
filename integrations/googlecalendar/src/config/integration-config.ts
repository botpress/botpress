import * as bp from '.botpress'

export namespace IntegrationConfig {
  export const getOAuthConfig = ({ ctx }: { ctx: bp.Context }) => ({
    clientId: _getOAuthClientId({ ctx }),
    clientSecret: _getOAuthClientSecret({ ctx }),
    endpoint: _getOAuthEndpoint({ ctx }),
  })

  const _getOAuthEndpoint = ({ ctx }: { ctx: bp.Context }) =>
    ctx.configurationType === 'serviceAccountKey' ? 'https://botpress.com' : `${process.env.BP_WEBHOOK_URL}/oauth`

  const _getOAuthClientId = ({ ctx }: { ctx: bp.Context }) =>
    ctx.configurationType === 'serviceAccountKey' ? ctx.configuration.oauthClientId : bp.secrets.CLIENT_ID

  const _getOAuthClientSecret = ({ ctx }: { ctx: bp.Context }) =>
    ctx.configurationType === 'serviceAccountKey' ? ctx.configuration.oauthClientSecret : bp.secrets.CLIENT_SECRET
}
