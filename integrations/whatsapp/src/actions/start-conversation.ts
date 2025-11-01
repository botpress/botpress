import { formatPhoneNumber } from 'src/misc/phone-number-to-whatsapp'
import { posthogCapture, postHogEvents } from 'src/misc/posthogClient'
import { getTemplateText, parseTemplateVariablesJSON } from 'src/misc/template-utils'
import { TemplateVariables } from 'src/misc/types'
import { hasAtleastOne, logForBotAndThrow } from 'src/misc/util'
import { BodyComponent, BodyParameter, Language, Template } from 'whatsapp-api-js/messages'
import { getDefaultBotPhoneNumberId, getAuthenticatedWhatsappClient } from '../auth'
import * as bp from '.botpress'

export const sendTemplateMessage: bp.IntegrationProps['actions']['sendTemplateMessage'] = async (props) => {
  return startConversation({
    ...props,
    type: 'startConversation',
  })
}

export const startConversation: bp.IntegrationProps['actions']['startConversation'] = async ({
  ctx,
  input,
  client,
  logger,
}) => {
  // Prevent the use of billable resources through the sandbox account
  if (ctx.configurationType === 'sandbox') {
    logForBotAndThrow('Sending template is not supported in sandbox mode', logger)
  }

  const { userPhone, templateName, templateVariablesJson } = input.conversation
  const botPhoneNumberId = input.conversation.botPhoneNumberId
    ? input.conversation.botPhoneNumberId
    : await getDefaultBotPhoneNumberId(client, ctx).catch(() => {
        logForBotAndThrow('No default bot phone number ID available', logger)
      })

  const templateLanguage = input.conversation.templateLanguage || 'en'
  let templateVariables: TemplateVariables = []
  if (templateVariablesJson) {
    templateVariables = parseTemplateVariablesJSON(templateVariablesJson, logger)
  }

  let formattedUserPhone = userPhone
  try {
    formattedUserPhone = formatPhoneNumber(userPhone)
  } catch (thrown) {
    await posthogCapture({
      distinctId: userPhone,
      event: postHogEvents.INVALID_PHONE_NUMBER,
      properties: {
        from: 'action',
      },
    })
    const errorMessage = (thrown instanceof Error ? thrown : new Error(String(thrown))).message
    logForBotAndThrow(`Failed to parse phone number "${userPhone}": ${errorMessage}`, logger)
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      botPhoneNumberId,
      userPhone: formattedUserPhone,
    },
  })

  const whatsapp = await getAuthenticatedWhatsappClient(client, ctx)
  const language = new Language(templateLanguage)
  const bodyParams: BodyParameter[] = templateVariables.map((variable) => ({
    type: 'text',
    text: variable.toString(),
  }))
  const components = hasAtleastOne(bodyParams) ? [new BodyComponent(...bodyParams)] : []
  const template = new Template(templateName, language, ...components)

  const response = await whatsapp.sendMessage(botPhoneNumberId, userPhone, template)

  if ('error' in response) {
    const errorJSON = JSON.stringify(response.error)
    logForBotAndThrow(
      `Failed to send WhatsApp template "${templateName}" with language "${templateLanguage}" - Error: ${errorJSON}`,
      logger
    )
  }

  await client
    .createMessage({
      origin: 'synthetic',
      conversationId: conversation.id,
      userId: ctx.botId,
      tags: {},
      type: 'text',
      payload: {
        text: await getTemplateText(ctx, client, logger, templateName, templateLanguage, templateVariables),
      },
    })
    .catch((err: any) => {
      logger.forBot().error(`Failed to Create synthetic message from template message - Error: ${err?.message ?? ''}`)
    })

  logger
    .forBot()
    .info(
      `Successfully sent WhatsApp template "${templateName}" with language "${templateLanguage}"${
        templateVariables && templateVariables.length
          ? ` using template variables: ${JSON.stringify(templateVariables)}`
          : ' without template variables'
      }`
    )

  return {
    conversationId: conversation.id,
  }
}
