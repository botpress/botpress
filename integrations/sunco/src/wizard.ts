import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { getSuncoClient } from './client'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const BOT_LIST_PATH = '/admin/ai/ai-agents/ai-agents/marketplace-bots'

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _start })
    .addStep({ id: 'get-subdomain', handler: _getSubdomain })
    .addStep({ id: 'add-to-channels', handler: _addToChannels })
    .addStep({ id: 'select-identifier', handler: _selectIdentifier })
    .addStep({ id: 'end', handler: _endHandler })
    .build()
  return await wizard.handleRequest()
}

const _start: WizardHandler = async (props) => {
  const { client, responses, ctx, inputValue } = props

  let subdomain = inputValue
  if (!subdomain) {
    const {
      state: { payload },
    } = await client.getOrSetState({
      name: 'credentials',
      type: 'integration',
      id: ctx.integrationId,
      payload: {},
    })
    if (!payload.subdomain) {
      return responses.redirectToStep('get-subdomain')
    }
    subdomain = payload.subdomain
  }

  const url = `https://${subdomain}.zendesk.com${BOT_LIST_PATH}`
  const htmlUrl = `<a href="${url}" target="_blank" rel="noopener noreferrer">
  here
</a>`
  return responses.displayButtons({
    pageTitle: 'Open Admin Center',
    htmlOrMarkdownPageContents: `Please click ${htmlUrl} to open your Admin Center on the \`AI => AI agents => AI agents => Marketplace bots\` page. (Click on \`Change subdomain\` if your subdomain is not \`${subdomain}\`.)`,
    buttons: [
      { action: 'navigate', label: 'Change subdomain', navigateToStep: 'get-subdomain', buttonType: 'secondary' },
      { action: 'navigate', label: 'Next step', navigateToStep: 'add-to-channels', buttonType: 'primary' },
    ],
  })
}

const _getSubdomain: WizardHandler = async (props) => {
  const { responses } = props
  return responses.displayInput({
    pageTitle: 'Enter your SunCo Subdomain',
    htmlOrMarkdownPageContents: 'To continue, you need to enter your SunCo subdomain',
    input: { label: 'e.g. https://{subdomain}.zendesk.com', type: 'text' },
    nextStepId: 'start',
  })
}

const _addToChannels: WizardHandler = async (props) => {
  const { responses } = props

  return responses.displayButtons({
    pageTitle: 'Add The Bot To Channels',
    htmlOrMarkdownPageContents:
      'Click on the Botpress bot. Then in the `Basics` section, select every channel for which you want Botpress to be the default responder. Click on the `Save` button.',
    buttons: [
      { action: 'navigate', label: 'Previous step', navigateToStep: 'start', buttonType: 'secondary' },
      { action: 'navigate', label: 'Next step', navigateToStep: 'select-identifier', buttonType: 'primary' },
    ],
  })
}

const _selectIdentifier: WizardHandler = async (props) => {
  const { responses, client, ctx, selectedChoice } = props

  if (selectedChoice) {
    await client.configureIntegration({ identifier: selectedChoice })
    return responses.redirectToStep('end')
  }

  const {
    state: { payload: credentials },
  } = await client.getOrSetState({
    name: 'credentials',
    type: 'integration',
    id: ctx.integrationId,
    payload: {},
  })

  if (!credentials.appId || !credentials.token) {
    return responses.displayButtons({
      pageTitle: 'Select Channel Integration',
      htmlOrMarkdownPageContents: 'Could not load credentials. Please go back and complete the setup.',
      buttons: [{ action: 'navigate', label: 'Go back', navigateToStep: 'add-to-channels', buttonType: 'secondary' }],
    })
  }

  const suncoClient = getSuncoClient({
    appId: credentials.appId,
    token: credentials.token,
    subdomain: credentials.subdomain,
  })
  const allIntegrations = await suncoClient.listIntegrations()
  const integrations = allIntegrations.filter((i) => i.defaultResponder?.integrationType === bp.secrets.CLIENT_ID)

  if (!integrations.length) {
    return responses.displayButtons({
      pageTitle: 'Select Channel Integration',
      htmlOrMarkdownPageContents:
        'No channels found with Botpress as the default responder. Go back and add at least one channel.',
      buttons: [{ action: 'navigate', label: 'Go back', navigateToStep: 'add-to-channels', buttonType: 'secondary' }],
    })
  }

  return responses.displayChoices({
    pageTitle: 'Select Channel Integration',
    htmlOrMarkdownPageContents: 'Select the channel integration you want to associate with this bot:',
    choices: integrations.map((i) => ({ label: i.displayName || i.id || 'Unknown', value: i.id! })),
    nextStepId: 'select-identifier',
  })
}

const _endHandler: WizardHandler = async ({ responses }) => {
  return responses.endWizard({ success: true })
}
