import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { webcrypto } from 'crypto'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({
      id: 'start',
      handler: _startHandler,
    })
    .addStep({
      id: 'get-subdomain',
      handler: _getSubdomain,
    })
    .addStep({
      id: 'end',
      handler: _endHandler,
    })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = (props) => {
  const { responses } = props
  return responses.displayInput({
    pageTitle: 'Get Zendesk Subdomain',
    htmlOrMarkdownPageContents: "To continue, you need to enter your Zendesk's subdomain",
    input: { label: 'e.g. https://{subdomain}.zendesk.com', type: 'text' },
    nextStepId: 'validate-subdomain',
  })
}

const _getSubdomain: WizardHandler = async (props) => {
  const { responses } = props
  return responses.displayInput({
    pageTitle: 'Get Zendesk Subdomain',
    htmlOrMarkdownPageContents: "To continue, you need to enter your Zendesk's subdomain",
    input: { label: 'e.g. https://{subdomain}.zendesk.com', type: 'text' },
    nextStepId: 'validate-subdomain',
  })
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({
    success: true,
  })
}

const sha256 = async (str: string) => {
  const data = new TextEncoder().encode(str)
  const hash = await webcrypto.subtle.digest('SHA-256', data)
  return Buffer.from(hash).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const _getOAuthRedirectUri = (ctx?: bp.Context) => oauthWizard.getWizardStepUrl('oauth-callback', ctx).toString()

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
