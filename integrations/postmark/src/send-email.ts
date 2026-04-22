import * as sdk from '@botpress/sdk'
import { randomUUID } from 'node:crypto'
import * as pm from 'postmark'
import * as bp from '.botpress'

export type SendEmailInput = Parameters<pm.ServerClient['sendEmail']>[0]

export type EmailRecipient = { email: string; name?: string }

export type SendArgs = {
  configuration: bp.configuration.Configuration
  conversation: { id: string; tags: { postmarkEmailAddress?: string; userEmailAddress?: string } }
  client: bp.Client
  input: Omit<SendEmailInput, 'From' | 'To' | 'Cc' | 'Bcc'> & {
    Cc?: EmailRecipient[]
    Bcc?: EmailRecipient[]
  }
}

export const formatRecipients = (recipients?: EmailRecipient[]): string | undefined => {
  if (!recipients || recipients.length === 0) return undefined
  return recipients.map(({ email, name }) => (name ? `"${name.replace(/"/g, '\\"')}" <${email}>` : email)).join(', ')
}

export const generateRfcMessageId = (fromEmail: string): string => {
  const domain = fromEmail.split('@')[1] || 'botpress.local'
  return `${randomUUID()}@${domain}`
}

const sendEmailMessage = async (input: SendEmailInput, { serverToken }: { serverToken: string }): Promise<void> => {
  const client = new pm.ServerClient(serverToken)
  await client.sendEmail(input)
}

const collectEmailThread = async (
  client: bp.Client,
  conversationId: string
): Promise<{ ids: string[]; inReplyTo: string | undefined }> => {
  const emails: Array<{ id: string; createdAt: string }> = []
  let nextToken: string | undefined
  do {
    const res = await client.listMessages({ conversationId, nextToken })
    for (const message of res.messages) {
      const emailMessageId = message.tags.emailMessageId
      if (!emailMessageId) continue
      emails.push({ id: emailMessageId, createdAt: message.createdAt })
    }
    nextToken = res.meta.nextToken
  } while (nextToken)

  emails.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const ids = emails.map((e) => e.id)
  return { ids, inReplyTo: ids.at(-1) }
}

export const send = async ({ configuration, conversation, client, input }: SendArgs): Promise<string> => {
  if (!conversation.tags.postmarkEmailAddress) {
    throw new sdk.RuntimeError(
      'Cannot send email: conversation is missing the "postmarkEmailAddress" tag. Ensure the conversation was created from an inbound email.'
    )
  }
  if (!conversation.tags.userEmailAddress) {
    throw new sdk.RuntimeError(
      'Cannot send email: conversation is missing the "userEmailAddress" tag. Ensure the conversation was created from an inbound email.'
    )
  }

  const { ids, inReplyTo } = await collectEmailThread(client, conversation.id)
  const outgoingMessageId = generateRfcMessageId(configuration.fromEmail)
  const headers: Array<{ Name: string; Value: string }> = [{ Name: 'Message-ID', Value: `<${outgoingMessageId}>` }]
  if (inReplyTo) {
    headers.push({ Name: 'In-Reply-To', Value: `<${inReplyTo}>` })
    headers.push({ Name: 'References', Value: ids.map((id) => `<${id}>`).join(' ') })
  }

  const { Cc, Bcc, ...rest } = input
  try {
    await sendEmailMessage(
      {
        ...rest,
        From: configuration.fromEmail,
        To: conversation.tags.userEmailAddress,
        Cc: formatRecipients(Cc),
        Bcc: formatRecipients(Bcc),
        Headers: headers,
      },
      { serverToken: configuration.serverToken }
    )
    return outgoingMessageId
  } catch (error) {
    if (error instanceof sdk.RuntimeError) {
      throw error
    }
    const message = error instanceof Error ? error.message : String(error)
    throw new sdk.RuntimeError(`Failed to send email via Postmark: ${message}`)
  }
}
