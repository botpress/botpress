import axios from 'axios'
import { Component, TemplateVariables, templateVariablesSchema } from 'src/misc/types'
import { getAccessToken } from '../auth'
import { logForBotAndThrow } from './util'
import * as bp from '.botpress'

export function parseTemplateVariablesJSON(templateVariablesJson: string, logger: bp.Logger): TemplateVariables {
  let templateVariablesRaw = []

  try {
    templateVariablesRaw = JSON.parse(templateVariablesJson)
  } catch (err: any) {
    logForBotAndThrow(
      `Value provided for Template Variables JSON isn't valid JSON (error: ${
        err?.message ?? ''
      }). Received: ${templateVariablesJson}`,
      logger
    )
  }

  const validationResult = templateVariablesSchema.safeParse(templateVariablesRaw)
  if (!validationResult.success) {
    logForBotAndThrow(
      `Template variables should be an array of strings or numbers (error: ${validationResult.error})`,
      logger
    )
  }

  return validationResult.data
}

export const getTemplateText = async (
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger,
  templateName: string,
  templateLanguage: string,
  bodyVariables: TemplateVariables
): Promise<string> => {
  const earlyReturnString = `Sent template "${templateName}" with language "${templateLanguage}"`

  const waba_id = await _getWabaId(ctx, client)
  if (!waba_id) {
    logger.forBot().debug("The configuration doesn't support having the full template in the Botpress' conversation")
    return earlyReturnString
  }

  const accessToken = await getAccessToken(client, ctx).catch((e) => {
    logger.forBot().debug('Failed to get access token - error:', e.response?.data || e.message || e)
    return earlyReturnString
  })

  const url = `https://graph.facebook.com/v20.0/${waba_id}/message_templates?name=${templateName}&language=${templateLanguage}`
  const templateComponents: Component[] | undefined = await axios
    .get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
      return earlyReturnString
    })

  if (!templateComponents) {
    logger.forBot().debug('The template components are undefined')
    return earlyReturnString
  }

  return _getTemplateText(templateComponents, bodyVariables, earlyReturnString)
}

const _getWabaId = async (ctx: bp.Context, client: bp.Client) => {
  if (ctx.configurationType === 'manual') {
    return ctx.configuration.whatsappBusinessAccountId
  } else {
    const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
    return state.payload.wabaId
  }
}

const _getTemplateText = (
  templateComponents: Component[],
  bodyVariables: TemplateVariables,
  earlyReturnString: string
) => {
  let templateText = ''
  for (const component of templateComponents) {
    const componentText = _parseComponent(component, bodyVariables)
    if (!componentText) {
      return earlyReturnString
    }
    templateText += componentText
  }
  return templateText
}

const _parseComponent = (component: Component, bodyVariables: TemplateVariables): string | undefined => {
  let compText
  switch (component.type) {
    case 'BODY':
      compText = component.text ?? 'body has no text'
      return `[BODY]\n${_getRenderedbodyText(compText, bodyVariables)}\n`
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

const _getRenderedbodyText = (text: string, bodyVariables: TemplateVariables): string => {
  bodyVariables.forEach((value, index) => {
    const placeholder = new RegExp(`{{${index + 1}}}`, 'g')
    text = text.replace(placeholder, value.toString())
  })

  return text
}
