import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { Response } from '@botpress/sdk'
import { REQUIRED_SLACK_SCOPES } from '../setup'
import { handleOAuthCallback } from '../webhook-events/handlers/oauth-callback'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'end', handler: _endHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ ctx, responses }) => {
  const redirectUri = `${process.env.BP_WEBHOOK_URL}/oauth`
  const scopes = REQUIRED_SLACK_SCOPES.join(',')
  const authorizeUrl = `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(bp.secrets.CLIENT_ID)}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(ctx.webhookId)}`

  return responses.redirectToExternalUrl(authorizeUrl)
}

const _oauthCallbackHandler: WizardHandler = async ({ req, client, ctx, logger, responses }) => {
  await handleOAuthCallback({ req, client, ctx, logger })

  return responses.redirectToStep('end')
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({ success: true })
}
