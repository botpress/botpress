import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { Language, Template } from 'whatsapp-api-js/messages'
import type { TemplateComponent } from 'whatsapp-api-js/types'
import { getDefaultBotPhoneNumberId, getAuthenticatedWhatsappClient } from '../auth'
import { safeFormatPhoneNumber } from '../misc/phone-number-to-whatsapp'
import {
  generateSyntheticTemplateText,
  parseTemplateVariablesJSON,
  buildHeaderComponents,
  buildBodyComponent,
  buildBodyComponentFromLegacy,
  buildButtonComponents,
} from '../misc/template-utils'
import { KeyValuePair } from '../misc/types'
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

  const {
    userPhone,
    templateName,
    templateVariablesJson,
    templateHeaderParams,
    templateBodyParams,
    templateButtonParams,
  } = input.conversation
  const botPhoneNumberId = input.conversation.botPhoneNumberId
    ? input.conversation.botPhoneNumberId
    : await getDefaultBotPhoneNumberId(client, ctx).catch(() => {
        logForBotAndThrow('No default bot phone number ID available', logger)
      })

  const templateLanguage = input.conversation.templateLanguage || 'en'

  const templateApiComponents: TemplateComponent[] = []
  const headerParams: KeyValuePair[] = templateHeaderParams ?? []
  let bodyParams: KeyValuePair[] = templateBodyParams ?? []

  if (headerParams.length > 0) {
    const headerComponent = buildHeaderComponents(headerParams)
    if (headerComponent) {
      templateApiComponents.push(headerComponent)
    }
  }

  if (bodyParams.length > 0) {
    const bodyComponent = buildBodyComponent(bodyParams)
    if (bodyComponent) {
      templateApiComponents.push(bodyComponent)
    }
    // TODO: Remove templateVariableJson in the next major
  } else if (templateVariablesJson) {
    const variables = parseTemplateVariablesJSON(templateVariablesJson, logger)
    const bodyComponent = buildBodyComponentFromLegacy(variables)
    if (bodyComponent) {
      templateApiComponents.push(bodyComponent)
    }
    if (Array.isArray(variables)) {
      bodyParams = variables.map((v, i) => ({ key: String(i + 1), value: v.toString() }))
    } else {
      bodyParams = Object.entries(variables).map(([key, value]) => ({ key, value: value.toString() }))
    }
  }

  const buttonParams: KeyValuePair[] = (templateButtonParams ?? []).map(({ key, value }) => ({
    key,
    value: value ?? '',
  }))
  if (buttonParams.length > 0) {
    templateApiComponents.push(...buildButtonComponents(buttonParams))
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
        text: await generateSyntheticTemplateText(
          ctx,
          client,
          logger,
          templateName,
          templateLanguage,
          bodyParams,
          headerParams
        ),
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
        bodyParams.length > 0
          ? ` using template variables: ${JSON.stringify(bodyParams)}`
          : ' without template variables'
      }`
    )

  return {
    conversationId: conversation.id,
  }
}
