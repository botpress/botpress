import { Conversation, RuntimeError } from '@botpress/client'
import { IntegrationContext } from '@botpress/sdk'
import {
  PhoneNumberIdTag,
  UserPhoneTag,
  TemplateNameTag,
  name,
  TemplateLanguageTag,
  TemplateVariablesTag,
} from 'integration.definition'
import { WhatsAppAPI, Types } from 'whatsapp-api-js'
import z from 'zod'
import { IntegrationLogger } from '.'
import * as botpress from '.botpress'
import { Channels } from '.botpress/implementation/channels'

const {
  Template: { Template, Language },
} = Types

const TemplateVariablesSchema = z.array(z.string().or(z.number()))

export async function startConversation(
  params: {
    channel: keyof Channels
    phoneNumberId: string
    userPhone: string
    templateName: string
    templateLanguage?: string
    templateVariablesJson?: string
  },
  dependencies: {
    client: botpress.Client

    ctx: IntegrationContext
    logger: IntegrationLogger
  }
): Promise<Pick<Conversation, 'id'>> {
  const { channel, phoneNumberId, userPhone, templateName, templateVariablesJson } = params
  const templateLanguage = params.templateLanguage || 'en_US'

  const { client, ctx, logger } = dependencies

  let templateVariables: z.infer<typeof TemplateVariablesSchema> = []

  if (!phoneNumberId) {
    logForBotAndThrow('Whatsapp Phone number ID to use as sender was not provided', logger)
  }

  if (!userPhone) {
    logForBotAndThrow('A Whatsapp recipient phone number needs to be provided', logger)
  }

  /*
  Whatsapp only allows using Message Templates for proactively starting conversations with users.
  See: https://developers.facebook.com/docs/whatsapp/pricing#opening-conversations
  */
  if (!templateName) {
    logForBotAndThrow('A Whatsapp template name needs to be provided', logger)
  }

  if (templateVariablesJson) {
    let templateVariablesRaw = []

    try {
      templateVariablesRaw = JSON.parse(templateVariablesJson)
    } catch (err) {
      logForBotAndThrow(
        `Value provided for Template Variables JSON isn't valid JSON (error: ${
          (err as Error)?.message ?? ''
        }). Received: ${templateVariablesJson}})`,
        logger
      )
    }

    const validationResult = TemplateVariablesSchema.safeParse(templateVariablesRaw)
    if (!validationResult.success) {
      logForBotAndThrow(
        `Template variables should be an array of strings or numbers (error: ${validationResult.error}))`,
        logger
      )
    }

    templateVariables = validationResult.data
  }

  const { conversation } = await client.getOrCreateConversation({
    channel,
    tags: {
      [PhoneNumberIdTag]: phoneNumberId,
      [UserPhoneTag]: userPhone,
    },
  })

  const whatsapp = new WhatsAppAPI(ctx.configuration.accessToken)

  const language = new Language(templateLanguage)

  const template = new Template(templateName, language, {
    type: 'body',
    parameters: templateVariables.map((variable) => ({
      type: 'text',
      text: variable,
    })),
  })

  const response = await whatsapp.sendMessage(phoneNumberId, userPhone, template)

  if (response?.error) {
    logForBotAndThrow(
      `Failed to start Whatsapp conversation using template "${templateName}" and language "${templateLanguage}" - Error: ${JSON.stringify(
        response.error
      )}`,
      logger
    )
  }

  logger
    .forBot()
    .info(
      `Successfully started Whatsapp conversation with template "${templateName}" and language "${templateLanguage}"${
        templateVariables && templateVariables.length
          ? ` using template variables: ${JSON.stringify(templateVariables)}`
          : ' without template variables'
      }`
    )

  return conversation
}

/**
 * This handler is for allowing bots to start conversations by calling `client.createConversation()` directly.
 */
export const createConversationHandler: botpress.IntegrationProps['createConversation'] = async ({
  client,
  channel,
  tags,
  ctx,
  logger,
}) => {
  const phoneNumberId = tags[`${name}:${PhoneNumberIdTag}`] || ctx.configuration.phoneNumberId
  const userPhone = tags[`${name}:${UserPhoneTag}`]!
  const templateName = tags[`${name}:${TemplateNameTag}`]!
  const templateLanguage = tags[`${name}:${TemplateLanguageTag}`]
  const templateVariablesJson = tags[`${name}:${TemplateVariablesTag}`]

  const conversation = await startConversation(
    { channel, phoneNumberId, userPhone, templateName, templateLanguage, templateVariablesJson },
    { client, ctx, logger }
  )

  return {
    body: JSON.stringify({ conversation: { id: conversation.id } }),
    headers: {},
    statusCode: 200,
  }
}

function logForBotAndThrow(message: string, logger: IntegrationLogger): never {
  logger.forBot().error(message)
  throw new RuntimeError(message)
}
