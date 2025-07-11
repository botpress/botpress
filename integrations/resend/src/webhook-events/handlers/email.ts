import {
  BaseEmailWebhookData,
  EmailBouncedWebhook,
  EmailDelayedWebhook,
  EmailDeliveredWebhook,
  EmailFailedToSendWebhook,
  EmailLinkClickedWebhook,
  EmailMarkedAsSpamWebhook,
  EmailOpenedWebhook,
  EmailSentWebhook,
} from '../schemas/email'
import * as bp from '.botpress'

export const handleSentEvent = async ({ client }: bp.HandlerProps, event: EmailSentWebhook) => {
  const { cc, bcc, rest: headers } = _extractCcsAndBccs(event.data)
  return await client.createEvent({
    type: 'sent',
    payload: {
      emailId: event.data.email_id,
      createdAt: event.created_at.toISOString(),
      to: event.data.to,
      from: event.data.from,
      subject: event.data.subject,
      headers: _undefinedIfEmpty(headers),
      tags: _undefinedIfEmpty(event.data.tags),
      cc,
      bcc,
    },
  })
}

export const handleDeliveredEvent = async ({ client }: bp.HandlerProps, event: EmailDeliveredWebhook) => {
  const { cc, bcc, rest: headers } = _extractCcsAndBccs(event.data)
  return await client.createEvent({
    type: 'delivered',
    payload: {
      emailId: event.data.email_id,
      createdAt: event.created_at.toISOString(),
      to: event.data.to,
      from: event.data.from,
      subject: event.data.subject,
      headers: _undefinedIfEmpty(headers),
      tags: _undefinedIfEmpty(event.data.tags),
      cc,
      bcc,
    },
  })
}

export const handleDeliveryDelayedEvent = async ({ client }: bp.HandlerProps, event: EmailDelayedWebhook) => {
  console.log({ client, event })

  const { cc, bcc, rest: headers } = _extractCcsAndBccs(event.data)

  return await client.createEvent({
    type: 'delayedDelivery',
    payload: {
      emailId: event.data.email_id,
      createdAt: event.created_at.toISOString(),
      to: event.data.to,
      from: event.data.from,
      subject: event.data.subject,
      headers: _undefinedIfEmpty(headers),
      tags: _undefinedIfEmpty(event.data.tags),
      cc,
      bcc,
    },
  })
}

export const handleMarkedAsSpamEvent = async ({ client }: bp.HandlerProps, event: EmailMarkedAsSpamWebhook) => {
  const { cc, bcc, rest: headers } = _extractCcsAndBccs(event.data)

  return await client.createEvent({
    type: 'markedAsSpam',
    payload: {
      emailId: event.data.email_id,
      createdAt: event.created_at.toISOString(),
      to: event.data.to,
      from: event.data.from,
      subject: event.data.subject,
      headers: _undefinedIfEmpty(headers),
      tags: _undefinedIfEmpty(event.data.tags),
      cc,
      bcc,
    },
  })
}

export const handleBouncedEvent = async ({ client }: bp.HandlerProps, event: EmailBouncedWebhook) => {
  console.log({ client, event })
  const { cc, bcc, rest: headers } = _extractCcsAndBccs(event.data)

  return await client.createEvent({
    type: 'bounced',
    payload: {
      emailId: event.data.email_id,
      createdAt: event.created_at.toISOString(),
      to: event.data.to,
      from: event.data.from,
      subject: event.data.subject,
      headers: _undefinedIfEmpty(headers),
      tags: _undefinedIfEmpty(event.data.tags),
      cc,
      bcc,
      type: event.data.bounce.type,
      subtype: event.data.bounce.subType,
      reason: event.data.bounce.message,
    },
  })
}

export const handleOpenedEvent = async ({ client }: bp.HandlerProps, event: EmailOpenedWebhook) => {
  const { cc, bcc, rest: headers } = _extractCcsAndBccs(event.data)
  return await client.createEvent({
    type: 'opened',
    payload: {
      emailId: event.data.email_id,
      createdAt: event.created_at.toISOString(),
      to: event.data.to,
      from: event.data.from,
      subject: event.data.subject,
      headers: _undefinedIfEmpty(headers),
      tags: _undefinedIfEmpty(event.data.tags),
      cc,
      bcc,
      openedAt: event.data.open.timestamp.toISOString(),
    },
  })
}

export const handleLinkClickedEvent = async ({ client }: bp.HandlerProps, event: EmailLinkClickedWebhook) => {
  const { cc, bcc, rest: headers } = _extractCcsAndBccs(event.data)
  return await client.createEvent({
    type: 'clicked',
    payload: {
      emailId: event.data.email_id,
      createdAt: event.created_at.toISOString(),
      to: event.data.to,
      from: event.data.from,
      subject: event.data.subject,
      headers: _undefinedIfEmpty(headers),
      tags: _undefinedIfEmpty(event.data.tags),
      cc,
      bcc,
      clickedAt: event.data.click.timestamp.toISOString(),
      url: event.data.click.link,
    },
  })
}

// I have yet to be able to trigger this
export const handleFailedToSendEvent = async ({ client }: bp.HandlerProps, event: EmailFailedToSendWebhook) => {
  const { cc, bcc, rest: headers } = _extractCcsAndBccs(event.data)
  return await client.createEvent({
    type: 'failed',
    payload: {
      emailId: event.data.email_id,
      createdAt: event.created_at.toISOString(),
      to: event.data.to,
      from: event.data.from,
      subject: event.data.subject,
      headers: _undefinedIfEmpty(headers),
      tags: _undefinedIfEmpty(event.data.tags),
      cc,
      bcc,
      reason: event.data.failed.reason,
    },
  })
}

// ======= Utility Functions =======

const _undefinedIfEmpty = <T>(arr: T[] | undefined): T[] | undefined => (arr && arr?.length > 0 ? arr : undefined)

const _extractCcsAndBccs = (data: BaseEmailWebhookData) => {
  const extractHeaderValuesOfName = (name: string) => {
    if (!data.headers) return undefined

    const headerValues = data.headers.reduce((acc, header) => {
      if (header.name.toLowerCase() !== name) return acc
      return acc.concat(header.value)
    }, [] as string[])

    return _undefinedIfEmpty(headerValues)
  }

  return {
    cc: extractHeaderValuesOfName('cc'),
    bcc: extractHeaderValuesOfName('bcc'),
    rest: data.headers?.filter(({ name }) => name.toLowerCase() !== 'cc' && name.toLowerCase() !== 'bcc'),
  }
}
