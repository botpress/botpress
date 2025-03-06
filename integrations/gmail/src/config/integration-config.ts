import * as bp from '.botpress'

export namespace IntegrationConfig {
  export const getOAuthConfig = ({ ctx }: { ctx: bp.Context }) => ({
    clientId: _getOAuthClientId({ ctx }),
    clientSecret: _getOAuthClientSecret({ ctx }),
    endpoint: _getOAuthEndpoint({ ctx }),
  })

  export const getPubSubTopicName = ({ ctx }: { ctx: bp.Context }) =>
    ctx.configurationType === 'customApp' ? ctx.configuration.pubsubTopicName : bp.secrets.TOPIC_NAME

  export const getPubSubWebhookSharedSecret = ({ ctx }: { ctx: bp.Context }) =>
    ctx.configurationType === 'customApp'
      ? ctx.configuration.pubsubWebhookSharedSecret
      : bp.secrets.WEBHOOK_SHARED_SECRET

  export const getPubSubWebhookServiceAccount = ({ ctx }: { ctx: bp.Context }) =>
    ctx.configurationType === 'customApp'
      ? ctx.configuration.pubsubWebhookServiceAccount
      : bp.secrets.WEBHOOK_SERVICE_ACCOUNT

  const _getOAuthEndpoint = ({ ctx }: { ctx: bp.Context }) =>
    ctx.configurationType === 'customApp' ? 'https://botpress.com' : `${process.env.BP_WEBHOOK_URL}/oauth`

  const _getOAuthClientId = ({ ctx }: { ctx: bp.Context }) =>
    ctx.configurationType === 'customApp' ? ctx.configuration.oauthClientId : bp.secrets.CLIENT_ID

  const _getOAuthClientSecret = ({ ctx }: { ctx: bp.Context }) =>
    ctx.configurationType === 'customApp' ? ctx.configuration.oauthClientSecret : bp.secrets.CLIENT_SECRET
}
