import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const BOT_LIST_PATH = '/admin/ai/ai-agents/ai-agents/marketplace-bots'

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _start })
    .addStep({ id: 'get-subdomain', handler: _getSubdomain })
    .addStep({ id: 'add-to-channels', handler: _addToChannels })
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
      { action: 'navigate', label: 'Finish', navigateToStep: 'end', buttonType: 'primary' },
    ],
  })
}

const _endHandler: WizardHandler = async ({ responses, client, ctx }) => {
  await client.configureIntegration({ identifier: ctx.webhookId })
  return responses.endWizard({ success: true })
}
