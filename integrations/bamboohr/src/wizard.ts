import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { handleOauthRequest } from './api/auth'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({
      id: 'start',
      handler: _startHandler,
    })
    .addStep({
      id: 'oauth-redirect',
      handler: _oauthRedirectHandler,
    })
    .addStep({
      id: 'oauth-callback',
      handler: _oauthCallbackHandler,
    })
    .addStep({
      id: 'end',
      handler: _endHandler,
    })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) => {
  return responses.displayInput({
    pageTitle: 'BambooHR Integration',
    htmlOrMarkdownPageContents: 'Please enter your BambooHR subdomain to continue.',
    input: {
      type: 'text',
      label: 'Subdomain',
    },
    nextStepId: 'oauth-redirect',
  })
}

const _oauthRedirectHandler: WizardHandler = async ({ inputValue, responses, ctx, client }) => {
  if (!inputValue) {
    return responses.endWizard({
      success: false,
      errorMessage: 'Subdomain is required',
    })
  }

  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      domain: inputValue,
      accessToken: '',
      refreshToken: '',
      expiresAt: 0,
      scopes: '',
    },
  })

  // Define the OAuth scopes required by BambooHR
  const scopes = [
    'email',
    'openid',
    'webhooks',
    'webhooks.write',
    'offline_access',
    'field',
    'employee',
    'employee:assets',
    'employee:compensation',
    'employee:contact',
    'employee:custom_fields',
    'employee:custom_fields_encrypted',
    'employee:demographic',
    'employee:dependent',
    'employee:dependent:ssn',
    'employee:education',
    'employee:emergency_contacts',
    'employee:file',
    'employee:identification',
    'employee:job',
    'employee:management',
    'employee:name',
    'employee:payroll',
    'employee:photo',
    'employee_directory',
    'company:info',
    'company_file',
  ]

  // Generate BambooHR OAuth URL with subdomain encoded in state
  const redirectUri = oauthWizard.getWizardStepUrl('oauth-callback')

  const oauthUrl =
    `https://${inputValue}.bamboohr.com/authorize.php?` +
    'request=authorize' +
    `&state=${ctx.webhookId}` +
    '&response_type=code' +
    `&scope=${scopes.join('+')}` +
    `&client_id=${bp.secrets.OAUTH_CLIENT_ID}` +
    `&redirect_uri=${redirectUri.toString()}`

  return responses.redirectToExternalUrl(oauthUrl)
}

const _oauthCallbackHandler: WizardHandler = async ({ query, responses, client, ctx, logger }) => {
  const code = query.get('code')
  const state = query.get('state')

  if (!code) {
    return responses.endWizard({
      success: false,
      errorMessage: 'Authorization code is required',
    })
  }

  if (!state) {
    return responses.endWizard({
      success: false,
      errorMessage: 'State parameter is missing',
    })
  }

  const redirectUri = oauthWizard.getWizardStepUrl('oauth-callback')

  const { state: oauthState } = await client
    .getState({
      type: 'integration',
      name: 'oauth',
      id: ctx.integrationId,
    })
    .catch((thrown) => {
      throw new Error('OAuth state not found', { cause: thrown })
    })

  const subdomain = oauthState.payload.domain

  try {
    // Complete OAuth flow with the subdomain
    await handleOauthRequest(
      {
        req: {
          query: `code=${code}&redirect_uri=${redirectUri.toString()}`,
          path: '/oauth',
          body: '',
          method: 'GET',
          headers: {},
        },
        client,
        ctx,
        logger,
      },
      subdomain
    )

    return responses.displayButtons({
      pageTitle: 'Setup Complete',
      htmlOrMarkdownPageContents: 'Your BambooHR integration has been successfully configured!',
      buttons: [
        {
          label: 'Done',
          buttonType: 'primary',
          action: 'navigate',
          navigateToStep: 'end',
        },
      ],
    })
  } catch (error) {
    console.error('error', error)
    return responses.endWizard({
      success: false,
      errorMessage: 'Failed to complete OAuth setup: ' + (error as Error).message,
    })
  }
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({
    success: true,
  })
}
