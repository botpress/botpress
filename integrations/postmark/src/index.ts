import * as sdk from '@botpress/sdk'
import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'
import * as pm from 'postmark'
import { type Attachment, postmarkInboundWebhookSchema } from './inbound-webhook'
import { messages, textToHtml } from './messages'
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

const extractThreadRoot = (headers: Array<{ Name: string; Value: string }>, fallbackId: string): string => {
  const references = headers.find((h) => h.Name === 'References')?.Value
  if (references) {
    const first = references.trim().split(/\s+/)[0]
    if (first) return first.replace(/[<>]/g, '')
  }
  const inReplyTo = headers.find((h) => h.Name === 'In-Reply-To')?.Value
  if (inReplyTo) return inReplyTo.trim().replace(/[<>]/g, '')
  return fallbackId
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
      throw new sdk.RuntimeError(
        `Postmark server already has an Inbound Hook URL set to "${server.InboundHookUrl}". Clear it in the Postmark dashboard before installing this integration.`
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
    getOrCreateReplyThreadConversation: async (props) => {
      const { client: bpClient, ctx, logger, input } = props
      const {
        conversation: { userEmailAddress, userName, cc, bcc, subject, text },
      } = input

      logger.forBotOnly().debug(`Opening a new reply thread with user email "${userEmailAddress}"`)

      const { user } = await bpClient.getOrCreateUser({
        name: userName || userEmailAddress,
        tags: {
          emailAddress: userEmailAddress,
        },
        discriminateByTags: ['emailAddress'],
      })

      const subjectLine = subject || '(No subject)'
      const pmClient = new pm.ServerClient(ctx.configuration.serverToken)
      let threadRootMessageId: string
      try {
        const response = await pmClient.sendEmail({
          From: ctx.configuration.fromEmail,
          To: userEmailAddress,
          Cc: cc,
          Bcc: bcc,
          Subject: subjectLine,
          TextBody: text,
          HtmlBody: textToHtml(text),
        })
        threadRootMessageId = response.MessageID
      } catch (thrown) {
        if (thrown instanceof sdk.RuntimeError) throw thrown
        const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
        throw new sdk.RuntimeError(`Failed to send email via Postmark: ${errorMessage}`)
      }

      const { conversation } = await bpClient.getOrCreateConversation({
        channel: 'mail',
        tags: {
          threadRootMessageId,
          postmarkEmailAddress: ctx.configuration.fromEmail,
          userEmailAddress,
        },
        discriminateByTags: ['threadRootMessageId'],
      })

      await bpClient.getOrCreateMessage({
        type: 'text',
        conversationId: conversation.id,
        userId: user.id,
        tags: {
          id: threadRootMessageId,
          emailMessageId: threadRootMessageId,
          subject: subjectLine,
          cc: cc || '',
          bcc: bcc || '',
        },
        payload: {
          text,
          subject: subjectLine,
        },
        discriminateByTags: ['id'],
      })

      return { conversationId: conversation.id }
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

    const threadRootMessageId = extractThreadRoot(email.Headers, email.MessageID)

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
        id: email.MessageID,
        emailMessageId: email.MessageID,
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
              id: `${email.MessageID}_attachment_${index}`,
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
