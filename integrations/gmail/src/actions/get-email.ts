import { wrapAction } from '../action-wrapper'

export const getEmail = wrapAction(
  { actionName: 'getEmail', errorMessage: 'Failed to get email' },
  async ({ googleClient }, { messageId }) => {
    const message = await googleClient.getMessageById(messageId)
    console.info('Retrieved email message:', message.id)
    
    if (!message) {
      throw new Error('Email not found')
    }

    // Extract headers
    const headers = message.payload?.headers || []
    const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

    // Extract body content
    const extractBody = (payload: any): { text: string; html: string } => {
      let text = ''
      let html = ''

      if (payload.body?.data) {
        const content = Buffer.from(payload.body.data, 'base64').toString('utf-8')
        if (payload.mimeType === 'text/plain') {
          text = content
        } else if (payload.mimeType === 'text/html') {
          html = content
        }
      }

      if (payload.parts) {
        for (const part of payload.parts) {
          const partBody = extractBody(part)
          text += partBody.text
          html += partBody.html
        }
      }

      return { text, html }
    }

    const body = extractBody(message.payload)

    return {
      id: message.id || '',
      threadId: message.threadId || '',
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      cc: getHeader('Cc'),
      bcc: getHeader('Bcc'),
      date: getHeader('Date'),
      snippet: message.snippet || '',
      bodyText: body.text,
      bodyHtml: body.html,
      labelIds: message.labelIds || [],
      sizeEstimate: message.sizeEstimate || 0,
      isUnread: message.labelIds?.includes('UNREAD') || false
    }
  }
)