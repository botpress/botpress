import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { z } from '@botpress/sdk'
import { Telegraf } from 'telegraf'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const _tokenSchema = z.object({
  botToken: z.string().min(1).secret().title('Bot Token').describe('The bot token from @BotFather'),
})

const _tokenForm = {
  pageTitle: 'Connect Telegram',
  htmlOrMarkdownPageContents:
    'Paste the bot token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">@BotFather</a>.<br>' +
    'Create a new bot with the <code>/newbot</code> command if you do not have one yet.',
  schema: _tokenSchema,
  nextStepId: 'finalize',
}

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'finalize', handler: _finalizeHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) => {
  return responses.displayForm(_tokenForm)
}

const _finalizeHandler: WizardHandler = async ({
  formValues,
  client,
  ctx,
  logger,
  responses,
  setIntegrationIdentifier,
}) => {
  if (!formValues) {
    return responses.redirectToStep('start')
  }

  const parsed = _tokenSchema.safeParse(formValues)
  if (!parsed.success) {
    return responses.displayForm({
      ..._tokenForm,
      errors: parsed.error,
      previousValues: formValues as z.input<typeof _tokenSchema>,
    })
  }

  const { botToken } = parsed.data

  let botUsername: string
  try {
    const telegraf = new Telegraf(botToken)
    const bot = await telegraf.telegram.getMe()
    botUsername = bot.username ?? String(bot.id)
  } catch (thrown: unknown) {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().debug('Token validation failed via getMe():', err)
    return responses.displayForm({
      ..._tokenForm,
      // not a real ZodError instance, displayForm only reads errors.issues
      errors: {
        issues: [{ code: 'custom', path: ['botToken'], message: 'Invalid bot token. Please check and try again.' }],
      } as unknown as z.ZodError<z.input<typeof _tokenSchema>>,
      previousValues: { botToken },
    })
  }

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: { botToken },
  })

  setIntegrationIdentifier(botUsername)
  return responses.endWizard({ success: true })
}
