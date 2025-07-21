import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { getPartialMetaClientCredentials, patchMetaClientCredentials } from '../../../misc/auth'
import { MetaClient } from '../../../misc/meta-client'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const ERROR_ACCESS_TOKEN_UNAVAILABLE = 'Access token is not available, please try again'

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({
      id: 'start',
      handler: _startHandler,
    })
    .addStep({
      id: 'reset',
      handler: _resetHandler,
    })
    .addStep({
      id: 'oauth-callback',
      handler: _oauthCallbackHandler,
    })
    .addStep({
      id: 'select-page',
      handler: _selectPageHandler,
    })
    .addStep({
      id: 'setup',
      handler: _setupHandler,
    })
    .addStep({
      id: 'end',
      handler: _endHandler,
    })
    .build()

  const response = await wizard.handleRequest()
  return response
}

const _startHandler: WizardHandler = ({ responses }) => {
  return responses.displayButtons({
    pageTitle: 'Reset Configuration',
    htmlOrMarkdownPageContents: `
    This wizard will reset your configuration, so the bot will stop working on Messenger until a new configuration is put in place, continue?
  `,
    buttons: [
      {
        action: 'navigate',
        label: 'Yes',
        navigateToStep: 'reset',
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

const _resetHandler: WizardHandler = async ({ responses, client, ctx }) => {
  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {},
  })
  return responses.redirectToExternalUrl(_getOAuthAuthorizationPromptUri(ctx))
}

const _oauthCallbackHandler: WizardHandler = async ({ responses, query, client, ctx, logger }) => {
  const authorizationCode = query.get('code')
  if (!authorizationCode) {
    return responses.endWizard({
      success: false,
      errorMessage: 'Error extracting authorization code in OAuth callback',
    })
  }

  const metaClient = new MetaClient(logger)
  const accessToken = await metaClient.exchangeAuthorizationCodeForAccessToken(
    authorizationCode,
    _getOAuthRedirectUri(ctx)
  )

  await patchMetaClientCredentials(client, ctx, { accessToken })

  return responses.redirectToStep('select-page')
}

const _selectPageHandler: WizardHandler = async ({ responses, client, ctx, logger }) => {
  const metaClient = new MetaClient(logger)
  const { accessToken } = await getPartialMetaClientCredentials(client, ctx).catch(() => ({ accessToken: undefined }))
  if (!accessToken) {
    return responses.endWizard({
      success: false,
      errorMessage: ERROR_ACCESS_TOKEN_UNAVAILABLE,
    })
  }

  const pages = await metaClient.getFacebookPagesFromToken(accessToken)

  return responses.displayChoices({
    choices: pages.map((page) => ({
      label: page.name,
      value: page.id,
    })),
    pageTitle: 'Select Page',
    htmlOrMarkdownPageContents: 'Choose a page to use for this bot:',
    nextStepId: 'setup',
  })
}

const _setupHandler: WizardHandler = async ({ responses, client, ctx, logger, selectedChoice }) => {
  const metaClient = new MetaClient(logger)
  const { accessToken } = await getPartialMetaClientCredentials(client, ctx).catch(() => ({ accessToken: undefined }))
  if (!accessToken) {
    return responses.endWizard({
      success: false,
      errorMessage: ERROR_ACCESS_TOKEN_UNAVAILABLE,
    })
  }

  if (!selectedChoice) {
    return responses.endWizard({
      success: false,
      errorMessage: 'No page selected',
    })
  }

  const pageId = selectedChoice
  await patchMetaClientCredentials(client, ctx, { pageId })

  const pageToken = await metaClient.getPageToken(accessToken, pageId)
  await patchMetaClientCredentials(client, ctx, { pageToken })

  await metaClient.subscribeToWebhooks(pageToken, pageId)

  await client.configureIntegration({
    identifier: pageId,
  })

  return responses.displayButtons({
    pageTitle: 'Configuration Complete',
    htmlOrMarkdownPageContents: `
Your configuration is now complete, and this bot will begin responding for the selected Facebook page. You can open it on Messenger to test it.

**Here are some things to verify if you are unable to communicate with your bot on Messenger**

-  Confirm that you are interacting with the page selected for this bot.
-  Double-check that you have published this bot.
    `,
    buttons: [
      {
        label: 'Okay',
        buttonType: 'primary',
        action: 'navigate',
        navigateToStep: 'end',
      },
    ],
  })
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({
    success: true,
  })
}

const _getOAuthAuthorizationPromptUri = (ctx?: bp.Context) =>
  'https://www.facebook.com/v19.0/dialog/oauth?' +
  'client_id=' +
  bp.secrets.CLIENT_ID +
  '&redirect_uri=' +
  _getOAuthRedirectUri(ctx) +
  '&config_id=' +
  bp.secrets.OAUTH_CONFIG_ID +
  '&override_default_response_type=true' +
  '&response_type=code'

const _getOAuthRedirectUri = (ctx?: bp.Context) => oauthWizard.getWizardStepUrl('oauth-callback', ctx).toString()
