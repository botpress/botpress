import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import * as sdk from '@botpress/sdk'
import { getAccessToken, updateRefreshTokenFromAuthorizationCode } from './auth'
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
          pageTitle: 'Google Drive Integration',
          htmlOrMarkdownPageContents: `
              This wizard will reset your Google Drive integration. This means
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
        client.configureIntegration({
          identifier: ctx.webhookId,
        })

        return responses.redirectToStep('file-picker')
      },
    })

    .addStep({
      id: 'file-picker',
      async handler({ responses, client, ctx }) {
        return responses.displayButtons({
          pageTitle: 'Google Drive Integration',
          htmlOrMarkdownPageContents: `
            You will now be asked to select the files and folders you wish to
            grant access to. This is necessary for the integration to work
            properly.

            If you do not give access to any files or folders, the integration
            will only be able to access files that are created through the
            integration.

            <script>
              function createPicker() {
                new google.picker.PickerBuilder()
                    .addView(new google.picker.DocsView()
                      .setIncludeFolders(true)
                      .setSelectFolderEnabled(true)
                      .setMode(google.picker.DocsViewMode.LIST))
                    .enableFeature(google.picker.Feature.NAV_HIDDEN)
                    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
                    .setTitle('Select the files and folders you wish to share with Botpress')
                    .setOAuthToken('${await getAccessToken({ client, ctx })}')
                    .setDeveloperKey('${bp.secrets.FILE_PICKER_API_KEY}')
                    .setCallback((data) => {
                      if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                        document.location.href = '${oauthWizard.getWizardStepUrl('end', ctx).href}';
                      }})
                    .setSize(640,790)
                    .setAppId('${bp.secrets.CLIENT_ID.split('-')[0]}')
                    .build().setVisible(true);
              }
            </script>
            <script async defer src="https://apis.google.com/js/api.js" onload="gapi.load('picker')"></script>
            `,
          buttons: [
            {
              action: 'javascript',
              label: 'Select files',
              callFunction: 'createPicker',
              buttonType: 'primary',
            },
            {
              action: 'navigate',
              label: 'Skip file selection',
              navigateToStep: 'end',
              buttonType: 'warning',
            },
          ],
        })
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
  'https%3A//www.googleapis.com/auth/drive.file&access_type=offline' +
  '&include_granted_scopes=true&response_type=code&prompt=consent' +
  `&state=${ctx.webhookId}&redirect_uri=${encodeURI(_getOAuthRedirectUri().href)}` +
  `&client_id=${bp.secrets.CLIENT_ID}`

const _getOAuthRedirectUri = () => oauthWizard.getWizardStepUrl('oauth-callback')
