import * as sdk from '@botpress/sdk'
import { Buffer } from 'node:buffer'
import { send, type SendEmailInput } from './send-email'
import * as bp from '.botpress'

type MessageHandlers = bp.IntegrationProps['channels']['mail']['messages']

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const textToHtml = (str: string): string => escapeHtml(str).replace(/\r\n|\r|\n/g, '<br>')

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/webm': 'weba',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/json': 'json',
  'text/plain': 'txt',
  'text/html': 'html',
  'text/csv': 'csv',
}

const filenameFromUrl = (url: string, contentType: string): string => {
  let pathname: string
  try {
    pathname = new URL(url).pathname
  } catch (thrown) {
    const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
    throw new sdk.RuntimeError(`Invalid URL "${url}": ${errorMessage}`)
  }
  const lastSegment = pathname.split('/').pop() || ''
  if (lastSegment.includes('.')) {
    return lastSegment
  }
  const base = lastSegment || 'attachment'
  const ext = CONTENT_TYPE_EXTENSIONS[contentType.split(';')[0]?.trim().toLowerCase() ?? '']
  return ext ? `${base}.${ext}` : base
}

const FETCH_TIMEOUT_MS = 30_000
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB — Postmark's limit

const fetchAsAttachment = async (
  url: string
): Promise<{ Name: string; Content: string; ContentType: string; ContentID: string }> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!response.ok) {
    throw new sdk.RuntimeError(`Failed to fetch attachment from ${url}: ${response.status} ${response.statusText}`)
  }

  const contentLength = response.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_ATTACHMENT_SIZE) {
    throw new sdk.RuntimeError(`Attachment at ${url} exceeds maximum size of 10MB`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.byteLength > MAX_ATTACHMENT_SIZE) {
    throw new sdk.RuntimeError(`Attachment at ${url} exceeds maximum size of 10MB`)
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  return {
    Name: filenameFromUrl(url, contentType),
    Content: buffer.toString('base64'),
    ContentType: contentType,
    ContentID: '',
  }
}

const tryFetchAttachment = async (url: string, logger: bp.Logger) => {
  try {
    return await fetchAsAttachment(url)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.forBot().warn(`Failed to fetch attachment, sending email without it: ${message}`)
    return null
  }
}

type AckFn = (args: { tags: { id?: string; emailMessageId?: string } }) => Promise<void>

const ackSent = (ack: AckFn, id: string) => ack({ tags: { id, emailMessageId: id } })

export const messages: MessageHandlers = {
  text: async ({ ctx, payload, conversation, client, ack }) => {
    const id = await send({
      configuration: ctx.configuration,
      conversation,
      client,
      input: {
        Subject: payload.subject || '(No subject)',
        HtmlBody: textToHtml(payload.text),
        TextBody: payload.text,
        Cc: payload.cc,
        Bcc: payload.bcc,
      },
    })
    await ackSent(ack, id)
  },

  image: async ({ ctx, payload, conversation, client, ack }) => {
    const attachment = await fetchAsAttachment(payload.imageUrl)
    const body = `(attachment: ${attachment.Name})`
    const id = await send({
      configuration: ctx.configuration,
      conversation,
      client,
      input: {
        Subject: payload.subject || '(No subject)',
        HtmlBody: `<p>${escapeHtml(body)}</p>`,
        TextBody: body,
        Cc: payload.cc,
        Bcc: payload.bcc,
        Attachments: [attachment],
      },
    })
    await ackSent(ack, id)
  },

  file: async ({ ctx, payload, conversation, client, ack }) => {
    const attachment = await fetchAsAttachment(payload.fileUrl)
    const body = `(attachment: ${attachment.Name})`
    const id = await send({
      configuration: ctx.configuration,
      conversation,
      client,
      input: {
        Subject: payload.subject || '(No subject)',
        HtmlBody: `<p>${escapeHtml(body)}</p>`,
        TextBody: body,
        Cc: payload.cc,
        Bcc: payload.bcc,
        Attachments: [attachment],
      },
    })
    await ackSent(ack, id)
  },

  audio: async ({ ctx, payload, conversation, client, ack }) => {
    const attachment = await fetchAsAttachment(payload.audioUrl)
    const body = `(attachment: ${attachment.Name})`
    const id = await send({
      configuration: ctx.configuration,
      conversation,
      client,
      input: {
        Subject: payload.subject || '(No subject)',
        HtmlBody: `<p>${escapeHtml(body)}</p>`,
        TextBody: body,
        Cc: payload.cc,
        Bcc: payload.bcc,
        Attachments: [attachment],
      },
    })
    await ackSent(ack, id)
  },

  video: async ({ ctx, payload, conversation, client, ack }) => {
    const attachment = await fetchAsAttachment(payload.videoUrl)
    const body = `(attachment: ${attachment.Name})`
    const id = await send({
      configuration: ctx.configuration,
      conversation,
      client,
      input: {
        Subject: payload.subject || '(No subject)',
        HtmlBody: `<p>${escapeHtml(body)}</p>`,
        TextBody: body,
        Cc: payload.cc,
        Bcc: payload.bcc,
        Attachments: [attachment],
      },
    })
    await ackSent(ack, id)
  },

  location: async ({ ctx, payload, conversation, client, ack }) => {
    const mapsUrl = `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`

    let htmlBody = ''
    let textBody = ''

    if (payload.title) {
      htmlBody += `<p><strong>${escapeHtml(payload.title)}</strong></p>`
      textBody += `${payload.title}\n`
    }
    if (payload.address) {
      htmlBody += `<p>${escapeHtml(payload.address)}</p>`
      textBody += `${payload.address}\n`
    }
    htmlBody += `<p><a href="${mapsUrl}">View on Google Maps</a></p>`
    textBody += mapsUrl

    const id = await send({
      configuration: ctx.configuration,
      conversation,
      client,
      input: {
        Subject: payload.subject || payload.title || 'Location',
        HtmlBody: htmlBody,
        TextBody: textBody,
        Cc: payload.cc,
        Bcc: payload.bcc,
      },
    })
    await ackSent(ack, id)
  },

  card: async ({ ctx, payload, conversation, client, logger, ack }) => {
    let htmlBody = `<h2>${escapeHtml(payload.title)}</h2>`
    let textBody = payload.title

    if (payload.subtitle) {
      htmlBody += `<p>${escapeHtml(payload.subtitle)}</p>`
      textBody += `\n${payload.subtitle}`
    }

    if (payload.actions.length > 0) {
      htmlBody += '<p>'
      textBody += '\n'
      for (const action of payload.actions) {
        if (action.action === 'url') {
          htmlBody += `<a href="${escapeHtml(action.value)}">${escapeHtml(action.label)}</a><br>`
          textBody += `\n- ${action.label}: ${action.value}`
        } else {
          htmlBody += `${escapeHtml(action.label)}<br>`
          textBody += `\n- ${action.label}`
        }
      }
      htmlBody += '</p>'
    }

    const attachments: NonNullable<SendEmailInput['Attachments']> = []

    if (payload.imageUrl) {
      const attachment = await tryFetchAttachment(payload.imageUrl, logger)
      if (attachment) {
        attachments.push(attachment)
      }
    }

    const id = await send({
      configuration: ctx.configuration,
      conversation,
      client,
      input: {
        Subject: payload.subject || payload.title || '(No subject)',
        HtmlBody: htmlBody,
        TextBody: textBody,
        Cc: payload.cc,
        Bcc: payload.bcc,
        Attachments: attachments,
      },
    })
    await ackSent(ack, id)
  },

  carousel: async ({ ctx, payload, conversation, client, logger, ack }) => {
    const htmlParts: string[] = []
    const textParts: string[] = []

    for (const item of payload.items) {
      let itemHtml = `<h2>${escapeHtml(item.title)}</h2>`
      let itemText = item.title

      if (item.subtitle) {
        itemHtml += `<p>${escapeHtml(item.subtitle)}</p>`
        itemText += `\n${item.subtitle}`
      }

      if (item.actions.length > 0) {
        itemHtml += '<p>'
        itemText += '\n'
        for (const action of item.actions) {
          if (action.action === 'url') {
            itemHtml += `<a href="${escapeHtml(action.value)}">${escapeHtml(action.label)}</a><br>`
            itemText += `\n- ${action.label}: ${action.value}`
          } else {
            itemHtml += `${escapeHtml(action.label)}<br>`
            itemText += `\n- ${action.label}`
          }
        }
        itemHtml += '</p>'
      }

      htmlParts.push(itemHtml)
      textParts.push(itemText)
    }

    const imageItems = payload.items.filter((item) => item.imageUrl)
    const results = await Promise.allSettled(imageItems.map((item) => fetchAsAttachment(item.imageUrl!)))
    const attachments: NonNullable<SendEmailInput['Attachments']> = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        attachments.push(result.value)
      } else {
        logger.forBot().warn(`Failed to fetch carousel image attachment, sending email without it: ${result.reason}`)
      }
    }

    const id = await send({
      configuration: ctx.configuration,
      conversation,
      client,
      input: {
        Subject: payload.subject || '(No subject)',
        HtmlBody: htmlParts.join('<hr>'),
        TextBody: textParts.join('\n---\n'),
        Cc: payload.cc,
        Bcc: payload.bcc,
        Attachments: attachments,
      },
    })
    await ackSent(ack, id)
  },

  choice: async ({ ctx, payload, conversation, client, ack }) => {
    const optionsHtml = payload.options.map((opt) => `<li>${escapeHtml(opt.label)}</li>`).join('')
    const optionsText = payload.options.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')

    const id = await send({
      configuration: ctx.configuration,
      conversation,
      client,
      input: {
        Subject: payload.subject || '(No subject)',
        HtmlBody: `<p>${escapeHtml(payload.text)}</p><ol>${optionsHtml}</ol>`,
        TextBody: `${payload.text}\n\n${optionsText}`,
        Cc: payload.cc,
        Bcc: payload.bcc,
      },
    })
    await ackSent(ack, id)
  },

  dropdown: async ({ ctx, payload, conversation, client, ack }) => {
    const optionsHtml = payload.options.map((opt) => `<li>${escapeHtml(opt.label)}</li>`).join('')
    const optionsText = payload.options.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')

    const id = await send({
      configuration: ctx.configuration,
      conversation,
      client,
      input: {
        Subject: payload.subject || '(No subject)',
        HtmlBody: `<p>${escapeHtml(payload.text)}</p><ol>${optionsHtml}</ol>`,
        TextBody: `${payload.text}\n\n${optionsText}`,
        Cc: payload.cc,
        Bcc: payload.bcc,
      },
    })
    await ackSent(ack, id)
  },

  bloc: async ({ ctx, payload, conversation, client, logger, ack }) => {
    const htmlParts: string[] = []
    const textParts: string[] = []
    const attachments: NonNullable<SendEmailInput['Attachments']> = []

    for (const item of payload.items) {
      switch (item.type) {
        case 'text':
          htmlParts.push(`<p>${escapeHtml(item.payload.text)}</p>`)
          textParts.push(item.payload.text)
          break
        case 'image': {
          const a = await tryFetchAttachment(item.payload.imageUrl, logger)
          if (a) {
            attachments.push(a)
          }
          break
        }
        case 'audio': {
          const a = await tryFetchAttachment(item.payload.audioUrl, logger)
          if (a) {
            attachments.push(a)
          }
          break
        }
        case 'video': {
          const a = await tryFetchAttachment(item.payload.videoUrl, logger)
          if (a) {
            attachments.push(a)
          }
          break
        }
        case 'file': {
          const a = await tryFetchAttachment(item.payload.fileUrl, logger)
          if (a) {
            attachments.push(a)
          }
          break
        }
        case 'location': {
          const mapsUrl = `https://www.google.com/maps?q=${item.payload.latitude},${item.payload.longitude}`
          let html = ''
          let text = ''
          if (item.payload.title) {
            html += `<p><strong>${escapeHtml(item.payload.title)}</strong></p>`
            text += `${item.payload.title}\n`
          }
          if (item.payload.address) {
            html += `<p>${escapeHtml(item.payload.address)}</p>`
            text += `${item.payload.address}\n`
          }
          html += `<p><a href="${mapsUrl}">View on Google Maps</a></p>`
          text += mapsUrl
          htmlParts.push(html)
          textParts.push(text)
          break
        }
      }
    }

    const attachmentNote = attachments.length > 0 ? `(attachments: ${attachments.map((a) => a.Name).join(', ')})` : ''
    const textBody = textParts.join('\n\n') || attachmentNote
    const htmlBody = htmlParts.join('') || (attachmentNote ? `<p>${escapeHtml(attachmentNote)}</p>` : '')

    const id = await send({
      configuration: ctx.configuration,
      conversation,
      client,
      input: {
        Subject: payload.subject || '(No subject)',
        HtmlBody: htmlBody,
        TextBody: textBody,
        Cc: payload.cc,
        Bcc: payload.bcc,
        Attachments: attachments,
      },
    })
    await ackSent(ack, id)
  },
}
