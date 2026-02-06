import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
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
      'This wizard will reset your configuration, so the bot will stop working on Zendesk until a new configuration is put in place, continue?',
    buttons: [
      {
        action: 'navigate',
        label: 'Yes',
        navigateToStep: 'get-subdomain',
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

const _oauthCallbackHandler: WizardHandler = async (props) => {
  const { responses, query, client, ctx } = props
  const authorizationCode = query.get('code')
  if (!authorizationCode) {
    return responses.endWizard({
      success: false,
      errorMessage: 'Error extracting authorization code in OAuth callback',
    })
  }

  const credentials = await _getCredentialsState(client, ctx)

  const newCredentials = { ...credentials }
  await _patchCredentialsState(client, ctx, newCredentials)

  await client.configureIntegration({ identifier: ctx.webhookId })

  return responses.redirectToStep('end')
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({
    success: true,
  })
}

// client.patchState is not working correctly
const _patchCredentialsState = async (
  client: bp.Client,
  ctx: bp.Context,
  newState: Partial<typeof bp.states.credentials>
) => {
  const currentState = await _getCredentialsState(client, ctx)

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: {
      ...currentState,
      ...newState,
    },
  })
}

const _getCredentialsState = async (client: bp.Client, ctx: bp.Context) => {
  try {
    return (
      (
        await client.getState({
          type: 'integration',
          name: 'credentials',
          id: ctx.integrationId,
        })
      )?.state?.payload || {}
    )
  } catch {
    return {}
  }
}
