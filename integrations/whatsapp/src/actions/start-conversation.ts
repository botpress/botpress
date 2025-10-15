import { RuntimeError, z } from '@botpress/sdk'
import axios from 'axios'
import { formatPhoneNumber } from 'src/misc/phone-number-to-whatsapp'
import { hasAtleastOne } from 'src/misc/util'
import { BodyComponent, BodyParameter, Language, Template } from 'whatsapp-api-js/messages'
import { getDefaultBotPhoneNumberId, getAuthenticatedWhatsappClient, getAccessToken, MetaOauthClient } from '../auth'
import * as bp from '.botpress'

const TemplateVariablesSchema = z.array(z.string().or(z.number()))

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
    _logForBotAndThrow('Starting a conversation is not supported in sandbox mode', logger)
  }

  const { userPhone, templateName, templateVariablesJson } = input.conversation
  const botPhoneNumberId = input.conversation.botPhoneNumberId
    ? input.conversation.botPhoneNumberId
    : await getDefaultBotPhoneNumberId(client, ctx).catch(() => {
        _logForBotAndThrow('No default bot phone number ID available', logger)
      })

  const templateLanguage = input.conversation.templateLanguage || 'en'
  let templateVariables: z.infer<typeof TemplateVariablesSchema> = []
  if (templateVariablesJson) {
    templateVariables = _parseTemplateVariablesJSON(templateVariablesJson, logger)
  }

  let formattedUserPhone = userPhone
  try {
    formattedUserPhone = formatPhoneNumber(userPhone)
  } catch (thrown) {
    const errorMessage = (thrown instanceof Error ? thrown : new Error(String(thrown))).message
    _logForBotAndThrow(`Failed to parse phone number (error: ${errorMessage}).`, logger)
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
    _logForBotAndThrow(
      `Failed to start WhatsApp conversation using template "${templateName}" and language "${templateLanguage}" - Error: ${errorJSON}`,
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
        text: await _getTemplateText(ctx, client, logger, templateName, templateLanguage, templateVariables),
      },
    })
    .catch((err: any) => {
      logger.forBot().error(`Failed to Create synthetic message from template message - Error: ${err?.message ?? ''}`)
    })

  logger
    .forBot()
    .info(
      `Successfully started WhatsApp conversation with template "${templateName}" and language "${templateLanguage}"${
        templateVariables && templateVariables.length
          ? ` using template variables: ${JSON.stringify(templateVariables)}`
          : ' without template variables'
      }`
    )

  return {
    conversationId: conversation.id,
  }
}

function _logForBotAndThrow(message: string, logger: bp.Logger): never {
  logger.forBot().error(message)
  throw new RuntimeError(message)
}

function _parseTemplateVariablesJSON(
  templateVariablesJson: string,
  logger: bp.Logger
): z.infer<typeof TemplateVariablesSchema> {
  let templateVariablesRaw = []

  try {
    templateVariablesRaw = JSON.parse(templateVariablesJson)
  } catch (err: any) {
    _logForBotAndThrow(
      `Value provided for Template Variables JSON isn't valid JSON (error: ${
        err?.message ?? ''
      }). Received: ${templateVariablesJson}`,
      logger
    )
  }

  const validationResult = TemplateVariablesSchema.safeParse(templateVariablesRaw)
  if (!validationResult.success) {
    _logForBotAndThrow(
      `Template variables should be an array of strings or numbers (error: ${validationResult.error})`,
      logger
    )
  }

  return validationResult.data
}

type Component =
  | {
      type: 'HEADER'
      format: 'TEXT'
      text?: string
    }
  | {
      type: 'HEADER'
      format: 'IMAGE' | 'VIDEO' | 'GIF' | 'DOCUMENT'
      example: {
        header_handle: string[]
      }
    }
  | {
      type: 'HEADER'
      format: undefined
      parameters: [
        {
          type: 'location'
          location: {
            latitude: string
            longitude: string
            name: string
            address: string
          }
        },
      ]
    }
  | {
      type: 'BODY'
      text?: string
    }
  | {
      type: 'FOOTER'
      text?: string
    }
  | {
      type: 'BUTTONS'
      buttons: { text?: string }[]
    }
  | {
      type: 'FLOW'
      text?: string
    }
  | {
      type: 'PHONE_NUMBER'
      text?: string
    }
  | {
      type: 'QUICK_REPLY'
      text?: string
    }
  | {
      type: 'URL'
      text?: string
    }

const _parseComponent = (
  component: Component,
  bodyText: z.infer<typeof TemplateVariablesSchema>
): string | undefined => {
  let compText
  switch (component.type) {
    case 'BODY':
      compText = component.text ?? 'body has no text'
      return `[BODY]\n${_getRenderedbodyText(compText, bodyText)}\n`
    case 'HEADER':
      if (!component.format) {
        compText = component.parameters.flatMap((parameter) => {
          return `lat: ${parameter.location.latitude} long: ${parameter.location.longitude} address: ${parameter.location.address} name: ${parameter.location.name}\n`
        })
        return `[HEADER LOCATION]\n${compText}`
      } else if (component.format === 'TEXT') {
        compText = component.text ?? 'header has no text'
        return `[HEADER TEXT]\n${component.text}\n`
      } else {
        compText = component.example.header_handle.flatMap((url) => `${url}\n`)
        return `[HEADER MEDIA ${component.format}]\n${compText}\n`
      }
    case 'BUTTONS':
      compText = component.buttons.flatMap((button) => {
        if (button.text) {
          return
        }
        return `${button.text}\n`
      })
      return `[buttons]\n${compText}`
    case 'FOOTER':
      compText = component.text ?? 'footer has no text'
      return `[FOOTER]\n${compText}\n`
    case 'FLOW':
      compText = component.text ?? 'body has no text'
      return `[FLOW]\n${compText}\n`
    case 'QUICK_REPLY':
      compText = component.text ?? 'body has no text'
      return `[QUICK_REPLY]\n${compText}\n`
    case 'PHONE_NUMBER':
      compText = component.text ?? 'body has no text'
      return `[PHONE_NUMBER]\n${compText}\n`
    case 'URL':
      compText = component.text ?? 'body has no text'
      return `[URL]\n${compText}\n`
    default:
      return undefined
  }
}

const _getRenderedbodyText = (text: string, bodyText: z.infer<typeof TemplateVariablesSchema>): string => {
  bodyText.forEach((value, index) => {
    const placeholder = new RegExp(`{{${index + 1}}}`, 'g')
    text = text.replace(placeholder, value.toString())
  })

  return text
}

const _getTemplateText = async (
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger,
  templateName: string,
  templateLanguage: string,
  bodyText: z.infer<typeof TemplateVariablesSchema>
): Promise<string> => {
  if (ctx.configurationType === 'manual') {
    return `Started WhatsApp conversation with template "${templateName}" and language "${templateLanguage}"`
  } else {
    let templateText = ''

    const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
    const accessToken = state.payload.accessToken ?? ''

    const metaOauthClient = new MetaOauthClient(logger)
    const waba_id = await metaOauthClient.getWhatsappBusinessesFromToken(accessToken).catch((e) => {
      logger.forBot().debug('Failed to fetch waba_id', e.response?.data || e.message || e)
      return `Started WhatsApp conversation with template "${templateName}" and language "${templateLanguage}"`
    })

    const url = `https://graph.facebook.com/v20.0/${waba_id}/message_templates?name=${templateName}&language=${templateLanguage}`
    const templateComponents: Component[] | undefined = await axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${await getAccessToken(client, ctx)}`,
        },
      })
      .then((res) => {
        if (!res.data.data[0]) {
          return undefined
        }
        return res.data.data[0].components
      })
      .catch((e) => {
        logger.forBot().debug('Failed to fetch template components', e.response?.data || e.message || e)
        return `Started WhatsApp conversation with template "${templateName}" and language "${templateLanguage}"`
      })

    if (!templateComponents) {
      logger.forBot().debug('The template components are undefined')
      return `Started WhatsApp conversation with template "${templateName}" and language "${templateLanguage}"`
    }

    for (const component of templateComponents) {
      const componentText = _parseComponent(component, bodyText)
      if (!componentText) {
        return `Started WhatsApp conversation with template "${templateName}" and language "${templateLanguage}"`
      }
      templateText += componentText
    }
    return templateText
  }
}
