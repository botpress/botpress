import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import * as sdk from '@botpress/sdk'
import { updateRefreshTokenFromAuthorizationCode } from './auth'
import { Client } from './client'
import { FileChannelsCache } from './file-channels-cache'
import { FileEventHandler } from './file-event-handler'
import { FilesCache } from './files-cache'
import { NotificationHandler } from './notification-handler'
import { notificationSchema } from './schemas'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, client, ctx, logger } = props

  if (oauthWizard.isOAuthWizardUrl(req.path)) {
    return await _handleOAuthWizard(props)
  }

  const notifParseResult = notificationSchema.safeParse(req)
  if (!notifParseResult.success) {
    console.error('Invalid request:', notifParseResult.error)
    return {
      status: 400,
      body: 'Invalid request',
    }
  }

  const notification = notifParseResult.data
  if (!NotificationHandler.isSupported(notification)) {
    return
  }

  const driveClient = await Client.create({ client, ctx, logger })
  const filesCache = await FilesCache.load({ client, ctx })
  const fileChannelsCache = await FileChannelsCache.load({ client, ctx })
  const fileEventHandler = new FileEventHandler(client, driveClient, filesCache, fileChannelsCache)
  const notificationHandler = new NotificationHandler(driveClient, filesCache, fileEventHandler)
  await notificationHandler.handle(notification)
  await filesCache.save()
  await fileChannelsCache.save()
  return
}

const _handleOAuthWizard = async (props: bp.HandlerProps): Promise<sdk.Response> => {
  const { client, ctx } = props

  const wizard = new oauthWizard.OAuthWizardBuilder(props)

    .addStep({
      id: 'start',
      handler({ responses }) {
        return responses.displayButtons({
          pageTitle: 'Google Drive Knowledge Base Integration',
          htmlOrMarkdownPageContents: `
              This wizard will reset your Google Drive Knowledge Base integration. This means
              that the integration will cease to function until you complete the
              authorization process.

              Do you wish to continue?
            `,
          buttons: [
            {
              action: 'external',
              label: 'Yes, continue',
              navigateToUrl: _getOAuthAuthorizationUri(ctx),
              buttonType: 'primary',
            },
            { action: 'close', label: 'No, cancel', buttonType: 'secondary' },
          ],
        })
      },
    })

    .addStep({
      id: 'oauth-callback',
      async handler({ query, responses }) {
        const authorizationCode = query.get('code')

        if (!authorizationCode) {
          console.error('Error extracting code from url in OAuth handler')
          return responses.endWizard({
            success: false,
            errorMessage: 'Error extracting code from url in OAuth handler',
          })
        }

        await updateRefreshTokenFromAuthorizationCode({ authorizationCode, client, ctx })

        // Done in order to correctly display the authorization status in the UI (not used for webhooks)
        await client.configureIntegration({
          identifier: ctx.webhookId,
        })

        return responses.redirectToStep('end')
      },
    })

    .addStep({
      id: 'end',
      handler({ responses }) {
        return responses.endWizard({
          success: true,
        })
      },
    })

    .build()

  return await wizard.handleRequest()
}

const _getOAuthAuthorizationUri = (ctx: { webhookId: string }) =>
  'https://accounts.google.com/o/oauth2/v2/auth?scope=' +
  'https%3A//www.googleapis.com/auth/drive.readonly&access_type=offline' +
  '&include_granted_scopes=true&response_type=code&prompt=consent' +
  `&state=${ctx.webhookId}&redirect_uri=${encodeURI(_getOAuthRedirectUri().href)}` +
  `&client_id=${bp.secrets.CLIENT_ID}`

const _getOAuthRedirectUri = () => oauthWizard.getWizardStepUrl('oauth-callback')
