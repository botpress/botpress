import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { Language, Template } from 'whatsapp-api-js/messages'
import type { TemplateComponent } from 'whatsapp-api-js/types'
import { getDefaultBotPhoneNumberId, getAuthenticatedWhatsappClient } from '../auth'
import { safeFormatPhoneNumber } from '../misc/phone-number-to-whatsapp'
import {
  getTemplateText,
  parseTemplateVariablesJSON,
  parseTemplateHeaderJSON,
  parseTemplateButtonsJSON,
  buildHeaderComponent,
  buildBodyComponent,
  buildButtonComponents,
} from '../misc/template-utils'
import { TemplateHeader, TemplateVariables } from '../misc/types'
import { logForBotAndThrow } from '../misc/util'
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

  const { userPhone, templateName, templateVariablesJson, templateHeaderJson, templateButtonsJson } = input.conversation
  const botPhoneNumberId = input.conversation.botPhoneNumberId
    ? input.conversation.botPhoneNumberId
    : await getDefaultBotPhoneNumberId(client, ctx).catch(() => {
        logForBotAndThrow('No default bot phone number ID available', logger)
      })

  const templateLanguage = input.conversation.templateLanguage || 'en'

  const templateApiComponents: TemplateComponent[] = []
  let bodyVariables: TemplateVariables = []
  let headerInfo: TemplateHeader | undefined

  if (templateHeaderJson) {
    headerInfo = parseTemplateHeaderJSON(templateHeaderJson, logger)
    templateApiComponents.push(buildHeaderComponent(headerInfo))
  }

  if (templateVariablesJson) {
    bodyVariables = parseTemplateVariablesJSON(templateVariablesJson, logger)
    const bodyComponent = buildBodyComponent(bodyVariables)
    if (bodyComponent) {
      templateApiComponents.push(bodyComponent)
    }
  }

  if (templateButtonsJson) {
    templateApiComponents.push(...buildButtonComponents(parseTemplateButtonsJSON(templateButtonsJson, logger)))
  }

  const formatPhoneNumberResponse = safeFormatPhoneNumber(userPhone)
  if (formatPhoneNumberResponse.success === false) {
    const distinctId = formatPhoneNumberResponse.error.id
    await posthogHelper.sendPosthogEvent(
      {
        distinctId: distinctId ?? 'no id',
        event: 'invalid_phone_number',
        properties: {
          from: 'action',
          phoneNumber: userPhone,
        },
      },
      { integrationName: INTEGRATION_NAME, integrationVersion: INTEGRATION_VERSION, key: bp.secrets.POSTHOG_KEY }
    )
    const errorMessage = formatPhoneNumberResponse.error.message
    logForBotAndThrow(`Failed to parse phone number "${userPhone}": ${errorMessage}`, logger)
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      botPhoneNumberId,
      userPhone: formatPhoneNumberResponse.phoneNumber,
    },
  })

  const whatsapp = await getAuthenticatedWhatsappClient(client, ctx)
  const language = new Language(templateLanguage)
  const template = new Template(templateName, language, ...templateApiComponents)

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
        text: await getTemplateText(ctx, client, logger, templateName, templateLanguage, bodyVariables, headerInfo),
      },
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : ''
      logger.forBot().error(`Failed to Create synthetic message from template message - Error: ${message}`)
    })

  logger
    .forBot()
    .info(
      `Successfully sent WhatsApp template "${templateName}" with language "${templateLanguage}"${
        bodyVariables && (Array.isArray(bodyVariables) ? bodyVariables.length > 0 : Object.keys(bodyVariables).length > 0)
          ? ` using template variables: ${JSON.stringify(bodyVariables)}`
          : ' without template variables'
      }`
    )

  return {
    conversationId: conversation.id,
  }
}
