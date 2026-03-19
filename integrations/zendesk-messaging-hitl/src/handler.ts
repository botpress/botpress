import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import { RuntimeError } from '@botpress/sdk'
import { getCredentials } from './api/get-credentials'
import { handleConversationMessage, handleSwitchboardReleaseControl } from './events'
import { isSuncoWebhookPayload } from './sunshine-events'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger, client } = props

  if (req.path.startsWith('/oauth')) {
    return await _handleOAuthCallback(props)
  }

  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  try {
    const data: unknown = JSON.parse(req.body)

    if (!isSuncoWebhookPayload(data)) {
      logger.forBot().warn('Received an invalid payload from Sunco')
      return
    }

    for (const event of data.events) {
      const suncoConversationId = event.payload.conversation?.id

      if (!suncoConversationId) {
        logger.forBot().warn('Event missing conversation ID, skipping')
        continue
      }

      const conversation = (
        await client.listConversations({
          channel: 'hitl',
          tags: {
            id: suncoConversationId,
          },
        })
      )?.conversations[0]

      if (!conversation) {
        logger
          .forBot()
          .warn(
            `Ignoring Sunshine conversation ${suncoConversationId} because it was not created by the startHitl action`
          )
        continue
      }

      const eventType = event.type
      switch (eventType) {
        case 'switchboard:releaseControl':
          await handleSwitchboardReleaseControl(event, conversation, client, logger)
          break
        case 'conversation:message':
          await handleConversationMessage(event, conversation, client, logger)
          break
        default:
          logger.forBot().debug(`Unhandled event type: ${eventType}`)
      }
    }
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().error(`Error processing Sunco webhook: ${errMsg}`)
  }

  return
}

const _handleOAuthCallback = async ({ req, client, ctx, logger }: bp.HandlerProps) => {
  try {
    logger.forBot().debug('Handling OAuth callback')

    const searchParams = new URLSearchParams(req.query)
    const authorizationCode = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      logger.forBot().error(`OAuth error: ${error} - ${errorDescription}`)
      throw new RuntimeError(`OAuth error: ${error} - ${errorDescription}`)
    }

    if (!authorizationCode) {
      logger.forBot().error('Authorization code not present in OAuth callback')
      throw new RuntimeError('Authorization code not present in OAuth callback')
    }

    const credentials = await getCredentials({ authorizationCode, logger })

    logger.forBot().info('Successfully authenticated via OAuth')

    await client.configureIntegration({ identifier: credentials.appId })

    await client.setState({
      type: 'integration',
      name: 'credentials',
      id: ctx.integrationId,
      payload: credentials,
    })

    return generateRedirection(getInterstitialUrl(true))
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    return generateRedirection(getInterstitialUrl(false, errMsg))
  }
}
