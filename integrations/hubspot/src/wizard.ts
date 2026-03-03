import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { exchangeCodeForOAuthCredentials, setOAuthCredentials } from './auth'
import { HubspotClient } from './hubspot-api'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const HUBSPOT_SCOPES = [
  'crm.schemas.contacts.write',
  'oauth',
  'crm.objects.owners.read',
  'crm.objects.leads.read',
  'crm.objects.leads.write',
  'crm.objects.contacts.write',
  'crm.objects.companies.write',
  'crm.objects.companies.read',
  'crm.objects.deals.read',
  'crm.schemas.contacts.read',
  'crm.objects.deals.write',
  'crm.objects.contacts.read',
]

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

const _startHandler: WizardHandler = ({ responses, ctx }) => {
  // If credentials are already in configuration, skip to OAuth redirect
  if (ctx.configurationType === 'manual' && ctx.configuration.clientId && ctx.configuration.clientSecret) {
    return responses.displayButtons({
      pageTitle: 'HubSpot Authorization',
      htmlOrMarkdownPageContents: `Click below to authorize Botpress to access your HubSpot account using your app credentials.`,
      buttons: [
        {
          label: 'Authorize with HubSpot',
          buttonType: 'primary',
          action: 'navigate',
          navigateToStep: 'oauth-redirect',
        },
      ],
    })
  }

  // Otherwise, ask for credentials
  return responses.displayInput({
    pageTitle: 'HubSpot Manual Configuration',
    htmlOrMarkdownPageContents: `Please provide your HubSpot app credentials to continue.

You can find these in your HubSpot app settings.`,
    input: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          title: 'Client ID',
        },
        clientSecret: {
          type: 'string',
          title: 'Client Secret',
        },
      },
    },
    nextStepId: 'oauth-redirect',
  })
}

const _oauthRedirectHandler: WizardHandler = async ({ inputValue, responses, ctx, client }) => {
  let clientId: string
  let clientSecret: string

  // Try to get credentials from configuration first
  if (ctx.configurationType === 'manual' && ctx.configuration.clientId && ctx.configuration.clientSecret) {
    clientId = ctx.configuration.clientId
    clientSecret = ctx.configuration.clientSecret
  } else {
    // Otherwise get from wizard input
    if (!inputValue) {
      return responses.endWizard({
        success: false,
        errorMessage: 'Client ID and Client Secret are required',
      })
    }

    const parsed = JSON.parse(inputValue)
    clientId = parsed.clientId
    clientSecret = parsed.clientSecret

    if (!clientId || !clientSecret) {
      return responses.endWizard({
        success: false,
        errorMessage: 'Both Client ID and Client Secret are required',
      })
    }
  }

  // Store the client credentials temporarily for the callback step
  await client.setState({
    type: 'integration',
    name: 'manualOauthCredentials',
    id: ctx.integrationId,
    payload: {
      clientId,
      clientSecret,
    },
  })

  // Use the same redirect URI as regular OAuth (/oauth)
  const redirectUri = `${process.env.BP_WEBHOOK_URL}/oauth`
  const scopes = HUBSPOT_SCOPES.join('+')

  const oauthUrl =
    `https://app.hubspot.com/oauth/authorize?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes}` +
    `&state=${ctx.webhookId}`

  return responses.redirectToExternalUrl(oauthUrl)
}

const _oauthCallbackHandler: WizardHandler = async ({ query, responses, client, ctx, logger }) => {
  const code = query.get('code')

  if (!code) {
    return responses.endWizard({
      success: false,
      errorMessage: 'Authorization code is required',
    })
  }

  // Retrieve the stored client credentials
  const { state: manualCredsState } = await client
    .getState({
      type: 'integration',
      name: 'manualOauthCredentials',
      id: ctx.integrationId,
    })
    .catch((thrown) => {
      throw new Error('Manual OAuth credentials not found', { cause: thrown })
    })

  const { clientId, clientSecret } = manualCredsState.payload

  try {
    // Exchange code for OAuth credentials using the user's client credentials
    const credentials = await exchangeCodeForOAuthCredentials({
      code,
      clientId,
      clientSecret,
    })

    // Store credentials along with client ID/secret for token refresh
    await setOAuthCredentials({
      client,
      ctx,
      credentials: {
        ...credentials,
        clientId,
        clientSecret,
      },
    })

    const hsClient = new HubspotClient({ accessToken: credentials.accessToken, client, ctx, logger })
    const hubId = await hsClient.getHubId()

    await client.configureIntegration({
      identifier: hubId,
    })

    // Clean up temporary credentials
    await client.deleteState({
      type: 'integration',
      name: 'manualOauthCredentials',
      id: ctx.integrationId,
    })

    return responses.displayButtons({
      pageTitle: 'Setup Complete',
      htmlOrMarkdownPageContents: 'Your HubSpot integration has been successfully configured!',
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
