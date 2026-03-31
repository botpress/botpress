import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import * as sdk from '@botpress/sdk'
import { GoogleClient } from 'src/google-api'
import { getAuthenticatedOAuth2Client } from 'src/google-api/oauth-client'
import * as bp from '.botpress'

export const handleOAuthWizard = async (props: bp.HandlerProps): Promise<sdk.Response> => {
  const { ctx } = props

  const wizard = new oauthWizard.OAuthWizardBuilder(props)

    .addStep({
      id: 'start',
      handler({ responses }) {
        return responses.displayButtons({
          pageTitle: 'Google Sheets Integration',
          htmlOrMarkdownPageContents: `
              This wizard will set up your Google Sheets integration. This will allow
              the integration to access your Google Sheets files.

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
      async handler({ query, responses, client, ctx, logger }) {
        const authorizationCode = query.get('code')
        const error = query.get('error')
        const state = query.get('state')

        if (error) {
          logger.forBot().error('OAuth error:', error)
          return responses.endWizard({
            success: false,
            errorMessage: `OAuth error: ${error}`,
          })
        }

        // Validate state parameter to prevent CSRF attacks
        if (state !== ctx.webhookId) {
          logger
            .forBot()
            .error('OAuth state mismatch — possible CSRF attack', { expected: ctx.webhookId, received: state })
          return responses.endWizard({
            success: false,
            errorMessage: 'Invalid OAuth state parameter.',
          })
        }

        if (!authorizationCode) {
          logger.forBot().error('Error extracting code from url in OAuth handler')
          return responses.endWizard({
            success: false,
            errorMessage: 'Error extracting code from url in OAuth handler',
          })
        }

        try {
          await GoogleClient.authenticateWithAuthorizationCode({
            client,
            ctx,
            authorizationCode,
            redirectUri: _getOAuthRedirectUri().href,
          })

          // Done in order to correctly display the authorization status in the UI
          await client.configureIntegration({
            identifier: ctx.webhookId,
          })

          return responses.redirectToStep('file-picker')
        } catch (err) {
          logger.forBot().error('Failed to authenticate with Google:', err)
          return responses.endWizard({
            success: false,
            errorMessage: `Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          })
        }
      },
    })

    .addStep({
      id: 'file-picker',
      async handler({ responses, client, ctx, logger }) {
        let accessToken: string
        try {
          accessToken = await _getAccessToken({ client, ctx })
        } catch (err) {
          logger.forBot().error('Failed to get access token for file picker:', err)
          return responses.endWizard({
            success: false,
            errorMessage: `Failed to get access token: ${err instanceof Error ? err.message : 'Unknown error'}`,
          })
        }

        return responses.displayButtons({
          pageTitle: 'Google Sheets Integration',
          htmlOrMarkdownPageContents: `
            You will now be asked to select the spreadsheet you wish to use
            with this integration. This is necessary for the integration to work
            properly.

            If you do not select a spreadsheet, you will need to manually
            configure the spreadsheet ID in the integration settings.

            <script>
              let pickerApiLoaded = false;

              function onPickerApiLoad() {
                pickerApiLoaded = true;
              }

              function createPicker() {
                if (!pickerApiLoaded) {
                  alert('The file picker is still loading. Please try again in a moment.');
                  return;
                }

                new google.picker.PickerBuilder()
                    .addView(new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
                      .setIncludeFolders(true)
                      .setSelectFolderEnabled(false)
                      .setMode(google.picker.DocsViewMode.LIST))
                    .enableFeature(google.picker.Feature.NAV_HIDDEN)
                    .setTitle('Select the spreadsheet you wish to use with Botpress')
                    .setOAuthToken(${JSON.stringify(accessToken)})
                    .setDeveloperKey(${JSON.stringify(bp.secrets.FILE_PICKER_API_KEY)})
                    .setCallback((data) => {
                      if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                        const docs = data[google.picker.Response.DOCUMENTS];
                        if (docs && docs.length > 0) {
                          const spreadsheetId = docs[0].id;
                          const nextUrl = new URL(${JSON.stringify(oauthWizard.getWizardStepUrl('end', ctx).href)});
                          nextUrl.searchParams.set('spreadsheetId', spreadsheetId);
                          document.location.href = nextUrl.href;
                        } else {
                          document.location.href = ${JSON.stringify(oauthWizard.getWizardStepUrl('end', ctx).href)};
                        }
                      } else if (data[google.picker.Response.ACTION] == google.picker.Action.CANCEL) {
                        // User closed the picker without selecting files.
                        // They can still click "Skip file selection" to continue.
                      }
                    })
                    .setSize(640,790)
                    // App ID must be the Google Cloud project number (numeric prefix of CLIENT_ID)
                    // Format: <project-number>-<rest>.apps.googleusercontent.com
                    .setAppId(${JSON.stringify(bp.secrets.CLIENT_ID.split('-')[0])})
                    .build().setVisible(true);
              }
            </script>
            <script async defer src="https://apis.google.com/js/api.js" onload="gapi.load('picker', onPickerApiLoad)"></script>
            `,
          buttons: [
            {
              action: 'javascript',
              label: 'Select spreadsheet',
              callFunction: 'createPicker',
              buttonType: 'primary',
            },
          ],
        })
      },
    })

    .addStep({
      id: 'end',
      async handler({ responses, query, client, ctx }) {
        const spreadsheetId = query.get('spreadsheetId')

        if (spreadsheetId) {
          // Save the spreadsheet ID to state
          await client.setState({
            id: ctx.integrationId,
            type: 'integration',
            name: 'spreadsheetConfig' as any,
            payload: { spreadsheetId } as any,
          })
        }

        return responses.endWizard({
          success: true,
        })
      },
    })

    .build()

  return await wizard.handleRequest()
}

const _getOAuthAuthorizationUri = (ctx: { webhookId: string }) =>
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  `scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.file')}` +
  '&access_type=offline' +
  '&include_granted_scopes=true' +
  '&response_type=code' +
  '&prompt=consent' +
  `&state=${encodeURIComponent(ctx.webhookId)}` +
  `&redirect_uri=${encodeURIComponent(_getOAuthRedirectUri().href)}` +
  `&client_id=${encodeURIComponent(bp.secrets.CLIENT_ID)}`

const _getOAuthRedirectUri = () => oauthWizard.getWizardStepUrl('oauth-callback')

const _getAccessToken = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }): Promise<string> => {
  const oauth2Client = await getAuthenticatedOAuth2Client({ client, ctx })
  const { token } = await oauth2Client.getAccessToken()

  if (!token) {
    throw new sdk.RuntimeError('Failed to get access token')
  }

  return token
}
