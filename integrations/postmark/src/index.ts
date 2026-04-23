import * as sdk from '@botpress/sdk'
import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'
import * as pm from 'postmark'
import { type Attachment, postmarkInboundWebhookSchema } from './inbound-webhook'
import { messages, textToHtml } from './messages'
import { formatRecipients, generateRfcMessageId, send } from './send-email'
import * as bp from '.botpress'

const MAX_INBOUND_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB — matches outbound cap

const getMessageType = (contentType: string): 'image' | 'audio' | 'video' | 'file' => {
  if (contentType.startsWith('image/')) {
    return 'image'
  }
  if (contentType.startsWith('audio/')) {
    return 'audio'
  }
  if (contentType.startsWith('video/')) {
    return 'video'
  }
  return 'file'
}

const sanitizeFilename = (name: string): string => name.replace(/[^\w.\-]/g, '_').slice(0, 120) || 'attachment'

const extractParentHeaders = (
  references: string | undefined,
  inReplyTo: string | undefined
): { root?: string; parent?: string } => {
  if (references) {
    const first = references.trim().split(/\s+/)[0]?.replace(/[<>]/g, '')
    if (first) {
      return { root: first }
    }
  }
  if (inReplyTo) {
    const parent = inReplyTo.trim().replace(/[<>]/g, '')
    if (parent) {
      return { parent }
    }
  }
  return {}
}

const extractThreadRoot = (headers: Array<{ Name: string; Value: string }>, fallbackId: string): string => {
  const { root, parent } = extractParentHeaders(
    headers.find((h) => h.Name === 'References')?.Value,
    headers.find((h) => h.Name === 'In-Reply-To')?.Value
  )
  return root ?? parent ?? fallbackId
}

const extractMessageIdHeader = (headers: Array<{ Name: string; Value: string }>): string | undefined => {
  const raw = headers.find((h) => h.Name.toLowerCase() === 'message-id')?.Value
  const trimmed = raw?.trim().replace(/^<|>$/g, '')
  return trimmed || undefined
}

type ConversationInformation = NonNullable<
  bp.actions.getOrCreateReplyThreadConversation.input.Input['conversation']['conversationInformation']
>

const findConversationByThreadRoot = async (bpClient: bp.Client, threadRootMessageId: string) => {
  const { conversations } = await bpClient.listConversations({ tags: { threadRootMessageId } })
  return conversations[0]
}

const findConversationByMessageId = async (bpClient: bp.Client, emailMessageId: string) => {
  const { messages } = await bpClient.listMessages({ tags: { emailMessageId } })
  const match = messages[0]
  if (!match) return undefined
  const { conversation } = await bpClient.getConversation({ id: match.conversationId })
  return conversation
}

const resolveExistingConversation = async (bpClient: bp.Client, info: ConversationInformation | undefined) => {
  if (!info) return undefined
  if (info.rootEmailId) {
    return findConversationByThreadRoot(bpClient, info.rootEmailId)
  }
  if (info.lastEmailId) {
    const byRoot = await findConversationByThreadRoot(bpClient, info.lastEmailId)
    if (byRoot) return byRoot
    return findConversationByMessageId(bpClient, info.lastEmailId)
  }
  return undefined
}

const uploadAttachment = async (attachment: Attachment, emailMessageId: string, index: number, client: bp.Client) => {
  const buffer = Buffer.from(attachment.Content, 'base64')
  if (buffer.byteLength > MAX_INBOUND_ATTACHMENT_SIZE) {
    throw new sdk.RuntimeError(
      `Inbound attachment "${attachment.Name}" exceeds maximum size of ${MAX_INBOUND_ATTACHMENT_SIZE} bytes`
    )
  }

  const { file } = await client.upsertFile({
    key: `postmark-attachment_${emailMessageId}_${index}_${sanitizeFilename(attachment.Name)}`,
    contentType: attachment.ContentType,
    size: buffer.byteLength,
    accessPolicies: ['public_content'],
    publicContentImmediatelyAccessible: true,
    tags: {
      source: 'integration',
      integration: 'postmark',
      channel: 'mail',
    },
  })

  const uploadResponse = await fetch(file.uploadUrl, {
    method: 'PUT',
    body: buffer,
    headers: {
      'Content-Type': attachment.ContentType,
      'Content-Length': String(buffer.byteLength),
      'x-amz-tagging': 'public=true',
    },
  })

  if (!uploadResponse.ok) {
    throw new sdk.RuntimeError(
      `Failed to upload attachment "${attachment.Name}" to storage: ${uploadResponse.status} ${uploadResponse.statusText}`
    )
  }

  return file.url
}

export default new bp.Integration({
  register: async ({ ctx, webhookUrl }) => {
    const client = new pm.ServerClient(ctx.configuration.serverToken)

    const server = await client.getServer().catch((thrown) => {
      const statusCode = (thrown as { statusCode?: number } | null)?.statusCode
      if (statusCode === 401 || statusCode === 403) {
        throw new sdk.RuntimeError('Invalid Postmark Server Token. Please check your configuration.')
      }
      const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
      throw new sdk.RuntimeError(`Failed to verify Postmark Server Token: ${errorMessage}`)
    })

    const InboundHookUrl = ctx.configuration.webhookSecret
      ? `${webhookUrl}?secret=${encodeURIComponent(ctx.configuration.webhookSecret)}`
      : webhookUrl

    if (server.InboundHookUrl && !server.InboundHookUrl.startsWith(webhookUrl)) {
      const displayUrl = server.InboundHookUrl.split('?')[0]
      throw new sdk.RuntimeError(
        `Postmark server already has an Inbound Hook URL set to "${displayUrl}". Clear it in the Postmark dashboard before installing this integration.`
      )
    }

    if (server.InboundHookUrl === InboundHookUrl) {
      return
    }

    await client
      .editServer({
        InboundHookUrl,
      })
      .catch((thrown) => {
        const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
        throw new sdk.RuntimeError(`Failed to set Postmark Inbound Hook URL: ${errorMessage}`)
      })
  },
  unregister: async ({ ctx, webhookUrl }) => {
    const finalUrl = ctx.configuration.webhookSecret
      ? `${webhookUrl}?secret=${encodeURIComponent(ctx.configuration.webhookSecret)}`
      : webhookUrl
    const client = new pm.ServerClient(ctx.configuration.serverToken)
    try {
      const { InboundHookUrl } = await client.getServer()
      if (InboundHookUrl === finalUrl) {
        await client.editServer({ InboundHookUrl: '' })
      }
    } catch (thrown) {
      const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
      throw new sdk.RuntimeError(`Failed to clear Postmark Inbound Hook URL: ${errorMessage}`)
    }
  },
  actions: {
    sendEmail: async (props) => {
      const { client: bpClient, ctx, logger, input } = props
      const { userEmailAddress, userName, cc, bcc, subject, text, conversationInformation } = input

      const subjectLine = subject || '(No subject)'
      const pmClient = new pm.ServerClient(ctx.configuration.serverToken)

      await bpClient.getOrCreateUser({
        name: userName || userEmailAddress,
        tags: { emailAddress: userEmailAddress },
        discriminateByTags: ['emailAddress'],
      })

      const { id: conversationId, messageId } = await (async () => {
        const existing = await resolveExistingConversation(bpClient, conversationInformation)

        if (existing) {
          logger.forBotOnly().debug(`Resolved existing reply thread conversation "${existing.id}"`)
          const id = await send({
            configuration: ctx.configuration,
            conversation: {
              id: existing.id,
              tags: {
                postmarkEmailAddress: existing.tags.postmarkEmailAddress,
                userEmailAddress: existing.tags.userEmailAddress,
              },
            },
            client: bpClient,
            input: { Subject: subjectLine, TextBody: text, HtmlBody: textToHtml(text), Cc: cc, Bcc: bcc },
          })
          return { id: existing.id, messageId: id }
        }

        if (conversationInformation?.rootEmailId || conversationInformation?.lastEmailId) {
          throw new sdk.RuntimeError(
            `No Botpress conversation found for thread root "${conversationInformation.rootEmailId ?? conversationInformation.lastEmailId}"`
          )
        }

        logger.forBotOnly().debug(`Opening a new reply thread with user email "${userEmailAddress}"`)
        const threadRootMessageId = generateRfcMessageId(ctx.configuration.fromEmail)
        await pmClient
          .sendEmail({
            From: ctx.configuration.fromEmail,
            To: userEmailAddress,
            Cc: formatRecipients(cc),
            Bcc: formatRecipients(bcc),
            Subject: subjectLine,
            TextBody: text,
            HtmlBody: textToHtml(text),
            Headers: [{ Name: 'Message-ID', Value: `<${threadRootMessageId}>` }],
          })
          .catch((thrown) => {
            if (thrown instanceof sdk.RuntimeError) throw thrown
            throw new sdk.RuntimeError(
              `Failed to send email via Postmark: ${thrown instanceof Error ? thrown.message : String(thrown)}`
            )
          })

        const { conversation } = await bpClient.getOrCreateConversation({
          channel: 'mail',
          tags: {
            threadRootMessageId,
            postmarkEmailAddress: ctx.configuration.fromEmail,
            userEmailAddress,
          },
          discriminateByTags: ['threadRootMessageId'],
        })
        return { id: conversation.id, messageId: threadRootMessageId }
      })()

      await bpClient.getOrCreateMessage({
        type: 'text',
        conversationId,
        userId: ctx.botId,
        origin: 'synthetic',
        tags: {
          id: messageId,
          emailMessageId: messageId,
          subject: subjectLine,
          cc: formatRecipients(cc) ?? '',
          bcc: formatRecipients(bcc) ?? '',
        },
        payload: { text, subject: subjectLine },
        discriminateByTags: ['id'],
      })
      logger.forBotOnly().debug(`Sent email message "${messageId}" in conversation "${conversationId}"`)
      return { conversationId }
    },
    getOrCreateReplyThreadConversation: async (props) => {
      const { client: bpClient, logger, input } = props
      const { conversationInformation } = input.conversation

      const conversation = await resolveExistingConversation(bpClient, conversationInformation)
      if (!conversation) {
        throw new sdk.RuntimeError('No existing conversation found for the provided conversation information')
      }

      logger.forBotOnly().debug(`Resolved existing reply thread conversation "${conversation.id}"`)
      return { conversationId: conversation.id }
    },
    getOrCreateUser: async (props) => {
      const { client: bpClient, logger, input } = props
      const { name, email } = input
      if (!email || email.trim() === '') {
        throw new sdk.RuntimeError('Email address is required to get or create a user')
      }

      const { user } = await bpClient.getOrCreateUser({
        name: name || email,
        tags: { emailAddress: email },
        discriminateByTags: ['emailAddress'],
      })

      logger.forBotOnly().debug(`Resolved user with email "${email}" to user ID "${user.id}"`)
      return { userId: user.id }
    },
  },
  channels: {
    mail: { messages },
  },
  handler: async (props) => {
    const { client, ctx, logger, req } = props

    if (ctx.configuration.webhookSecret) {
      const queryParams = new URLSearchParams(req.query)
      const provided = Buffer.from(queryParams.get('secret') || '', 'utf8')
      const expected = Buffer.from(ctx.configuration.webhookSecret, 'utf8')
      if (provided.byteLength !== expected.byteLength || !timingSafeEqual(provided, expected)) {
        return { status: 401, body: 'Unauthorized' }
      }
    }

    if (!req.body) {
      return { status: 400, body: 'No body found in the request' }
    }

    let parsedBody: unknown
    try {
      parsedBody = JSON.parse(req.body)
    } catch {
      logger.forBot().error('Failed to parse request body as JSON')
      return { status: 400, body: 'Invalid JSON payload' }
    }

    const parseResult = postmarkInboundWebhookSchema.safeParse(parsedBody)
    if (!parseResult.success) {
      logger
        .forBot()
        .error(
          `Failed to parse Postmark webhook payload: ${parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
        )
      return { status: 400, body: 'Invalid payload' }
    }

    const email = parseResult.data

    const { user } = await client.getOrCreateUser({
      name: email.FromName || email.From,
      tags: {
        emailAddress: email.From,
      },
      discriminateByTags: ['emailAddress'],
    })

    for (const recipient of [...email.ToFull, ...email.CcFull, ...email.BccFull]) {
      await client.getOrCreateUser({
        name: recipient.Name || recipient.Email,
        tags: {
          emailAddress: recipient.Email,
        },
        discriminateByTags: ['emailAddress'],
      })
    }

    const rfcMessageId = extractMessageIdHeader(email.Headers) ?? email.MessageID
    const threadRootMessageId = extractThreadRoot(email.Headers, rfcMessageId)

    const { conversation } = await client.getOrCreateConversation({
      channel: 'mail',
      tags: {
        threadRootMessageId,
        postmarkEmailAddress: email.To,
        userEmailAddress: email.From,
      },
      discriminateByTags: ['threadRootMessageId'],
    })

    await client.getOrCreateMessage({
      type: 'text',
      conversationId: conversation.id,
      tags: {
        id: rfcMessageId,
        emailMessageId: rfcMessageId,
        bcc: email.Bcc,
        cc: email.Cc,
        subject: email.Subject,
        spamScore: email.Headers.find((h) => h.Name.toLowerCase() === 'x-spam-score')?.Value || '',
      },
      userId: user.id,
      payload: {
        text: email.TextBody.length > 0 ? email.TextBody : email.HtmlBody,
        subject: email.Subject,
      },
      discriminateByTags: ['id'],
    })

    await Promise.all(
      email.Attachments.map(async (attachment, index) => {
        try {
          const fileUrl = await uploadAttachment(attachment, email.MessageID, index, client)
          const messageType = getMessageType(attachment.ContentType)

          const payload =
            messageType === 'image'
              ? { imageUrl: fileUrl }
              : messageType === 'audio'
                ? { audioUrl: fileUrl }
                : messageType === 'video'
                  ? { videoUrl: fileUrl }
                  : { fileUrl, filename: attachment.Name }

          await client.getOrCreateMessage({
            type: messageType,
            conversationId: conversation.id,
            tags: {
              id: `${rfcMessageId}_attachment_${index}`,
              subject: email.Subject,
              cc: email.Cc,
              bcc: email.Bcc,
              spamScore: email.Headers.find((h) => h.Name.toLowerCase() === 'x-spam-score')?.Value || '',
            },
            userId: user.id,
            payload,
            discriminateByTags: ['id'],
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          logger.forBot().warn(`Failed to process inbound attachment "${attachment.Name}": ${message}`)
        }
      })
    )

    return { status: 200, body: 'OK' }
  },
})
