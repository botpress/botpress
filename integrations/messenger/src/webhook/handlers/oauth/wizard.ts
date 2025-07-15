import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { MetaClient } from '../../../misc/client'
import * as bp from '.botpress'
import { Oauth as OAuthState } from '.botpress/implementation/typings/states/oauth'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const ERROR_ACCESS_TOKEN_UNAVAILABLE = 'Access token is not available, please try again'

const handler = async (props: bp.HandlerProps) => {
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
  return responses.redirectToExternalUrl(_getOAuthRedirectUri(ctx))
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
  const accessToken = await metaClient.getAccessToken(authorizationCode, _getOAuthRedirectUri())

  await _patchCredentials(client, ctx, { accessToken })

  return responses.redirectToStep('select-page')
}

const _selectPageHandler: WizardHandler = async ({ responses, client, ctx, logger }) => {
  const metaClient = new MetaClient(logger)
  const { accessToken } = await _getCredentials(client, ctx)
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
    pageTitle: 'Select a page',
    htmlOrMarkdownPageContents: 'Choose a page to use in this bot:',
    nextStepId: 'setup',
  })
}

const _setupHandler: WizardHandler = async ({ responses, client, ctx, logger, selectedChoice }) => {
  const metaClient = new MetaClient(logger)
  const { accessToken } = await _getCredentials(client, ctx)
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
  await _patchCredentials(client, ctx, { pageId })

  const pageToken = await metaClient.getPageToken(accessToken, pageId)
  await _patchCredentials(client, ctx, { pageToken })

  await metaClient.subscribeToWebhooks(pageToken, pageId)

  await client.configureIntegration({
    identifier: pageId,
  })

  return responses.displayButtons({
    pageTitle: 'Configuration Complete',
    htmlOrMarkdownPageContents: `
    Your configuration is now complete and the selected Facebook page will start answering as this bot, you can open it on Messenger and test it.

    **Here are some things to verify if you are unable to talk with your bot on Messenger**

    - Confirm if you are talking with the page that was selected for this bot
    - Double check if you published this bot
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

const _getOAuthRedirectUri = (ctx?: bp.Context) =>
  'https://www.facebook.com/v19.0/dialog/oauth?' +
  'client_id=' +
  bp.secrets.CLIENT_ID +
  '&redirect_uri=' +
  oauthWizard.getWizardStepUrl('oauth-callback', ctx) +
  '&config_id=' +
  bp.secrets.OAUTH_CONFIG_ID +
  '&override_default_response_type=true' + // TODO: What does this do?
  '&response_type=code'

// client.patchState is not working correctly
const _patchCredentials = async (client: bp.Client, ctx: bp.Context, newState: Partial<OAuthState['payload']>) => {
  const currentState = await _getCredentials(client, ctx).catch(() => ({}))

  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      ...currentState,
      ...newState,
    },
  })
}

const _getCredentials = async (client: bp.Client, ctx: bp.Context) => {
  return await client
    .getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })
    .then((result) => result.state.payload)
}

export default {
  handler,
}
