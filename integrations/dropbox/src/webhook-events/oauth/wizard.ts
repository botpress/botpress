import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { DropboxOAuthClient, getOAuthClientId } from '../../dropbox-api/oauth-client'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start-confirm', handler: _startHandler })
    .addStep({ id: 'redirect-to-dropbox', handler: _redirectToDropboxHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'end', handler: _endHandler })
    .build()

  const response = await wizard.handleRequest()
  return response
}

const _startHandler: WizardHandler = (props) => {
  const { responses } = props
  return responses.displayButtons({
    pageTitle: 'Reset Configuration',
    htmlOrMarkdownPageContents:
      'This wizard will reset your configuration, so the bot will stop working on Dropbox until a new configuration is put in place, continue?',
    buttons: [
      {
        action: 'navigate',
        label: 'Yes',
        navigateToStep: 'redirect-to-dropbox',
        buttonType: 'primary',
      },
      {
        action: 'close',
        label: 'No',
        buttonType: 'secondary',
      },
    ],
  })
}

const _redirectToDropboxHandler: WizardHandler = async (props) => {
  const { responses, ctx } = props
  const clientId = getOAuthClientId({ ctx })

  if (!clientId) {
    return responses.endWizard({
      success: false,
      errorMessage: 'Dropbox App Key (APP_KEY) is not configured. Please configure it in the integration settings.',
    })
  }

  const redirectUri = _getOAuthRedirectUri()
  console.log('OAuth redirect URI:', redirectUri)

  const dropboxAuthUrl =
    'https://www.dropbox.com/oauth2/authorize?' +
    'response_type=code' +
    '&token_access_type=offline' +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(ctx.webhookId)}`

  return responses.redirectToExternalUrl(dropboxAuthUrl)
}

const _getOAuthRedirectUri = (ctx?: bp.Context) => oauthWizard.getWizardStepUrl('oauth-callback', ctx).toString()

const _oauthCallbackHandler: WizardHandler = async (props) => {
  const { responses, query, client, ctx, logger } = props

  const oauthError = query.get('error')
  const oauthErrorDescription = query.get('error_description')
  if (oauthError) {
    const errorMessage = oauthErrorDescription
      ? `OAuth error: ${oauthError} - ${oauthErrorDescription}`
      : `OAuth error: ${oauthError}`
    logger.forBot().warn(errorMessage)
    return responses.endWizard({
      success: false,
      errorMessage,
    })
  }

  const authorizationCode = query.get('code')
  if (!authorizationCode) {
    const errorMessage =
      'No authorization code received from Dropbox. ' +
      'This may happen if you denied the authorization request, ' +
      'if the authorization code expired, or if there was an error during the OAuth flow. ' +
      'Please try authorizing again.'
    logger.forBot().warn(errorMessage)
    return responses.endWizard({
      success: false,
      errorMessage,
    })
  }

  logger.forBot().info(`Authorization code: ${authorizationCode.substring(0, 5)}...`)

  try {
    const redirectUri = _getOAuthRedirectUri()
    const oauthClient = new DropboxOAuthClient({ client, ctx })
    await oauthClient.processAuthorizationCode(authorizationCode, redirectUri)
    logger.forBot().info('Successfully exchanged authorization code for refresh token')

    await client.configureIntegration({ identifier: ctx.webhookId })

    return responses.endWizard({
      success: true,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? `Failed to process authorization code: ${error.message}. Please make sure the code is correct and hasn't expired.`
        : 'Failed to process authorization code. Please try again.'
    logger.forBot().error({ err: error }, errorMessage)
    return responses.endWizard({
      success: false,
      errorMessage,
    })
  }
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({
    success: true,
  })
}
