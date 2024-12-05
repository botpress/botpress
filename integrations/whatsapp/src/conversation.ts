import { Conversation } from '@botpress/client'
import { z, RuntimeError } from '@botpress/sdk'
import WhatsAppAPI from 'whatsapp-api-js'
import { AtLeastOne } from 'whatsapp-api-js/lib/types/utils'
import { BodyComponent, BodyParameter, Language, Template } from 'whatsapp-api-js/messages'
import { ServerErrorResponse, ServerMessageResponse } from 'whatsapp-api-js/types'
import { getAccessToken, getPhoneNumberId } from './misc/whatsapp'
import * as types from './types'
import * as bp from '.botpress'

type Channels = bp.channels.Channels

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
    client: bp.Client
    ctx: types.IntegrationCtx
    logger: types.Logger
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
        }). Received: ${templateVariablesJson}`,
        logger
      )
    }

    const validationResult = TemplateVariablesSchema.safeParse(templateVariablesRaw)
    if (!validationResult.success) {
      logForBotAndThrow(
        `Template variables should be an array of strings or numbers (error: ${validationResult.error})`,
        logger
      )
    }

    templateVariables = validationResult.data
  }

  const { conversation } = await client.getOrCreateConversation({
    channel,
    tags: {
      phoneNumberId,
      userPhone,
    },
  })

  const whatsapp = new WhatsAppAPI({ token: await getAccessToken(client, ctx), secure: false })

  const language = new Language(templateLanguage)

  const bodyParams: BodyParameter[] = templateVariables.map((variable) => ({
    type: 'text',
    text: variable.toString(),
  }))

  const body = new BodyComponent(...(bodyParams as AtLeastOne<BodyParameter>))

  const template = new Template(templateName, language, body)

  const response = (await whatsapp.sendMessage(phoneNumberId, userPhone, template)) as ServerMessageResponse
  const errorResponse = response as ServerErrorResponse

  if (errorResponse?.error) {
    logForBotAndThrow(
      `Failed to start Whatsapp conversation using template "${templateName}" and language "${templateLanguage}" - Error: ${JSON.stringify(
        errorResponse?.error
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
export const createConversationHandler: bp.IntegrationProps['createConversation'] = async ({
  client,
  channel,
  tags,
  ctx,
  logger,
}) => {
  const phoneNumberId: string | undefined = tags.phoneNumberId || (await getPhoneNumberId(client, ctx))

  if (!phoneNumberId) {
    throw new Error('phoneNumberId is required')
  }

  const userPhone = tags.userPhone || ''
  const templateName = tags.templateName || ''
  const templateLanguage = tags.templateLanguage
  const templateVariablesJson = tags.templateVariables

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

function logForBotAndThrow(message: string, logger: types.Logger): never {
  logger.forBot().error(message)
  throw new RuntimeError(message)
}
