import { wrapChannel } from './shared'

export const hitl = {
  messages: {
    text: wrapChannel(
      { channelName: 'hitl', messageType: 'text' },
      async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
        const { zendeskCommentId } = await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, payload.text)
        await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
      }
    ),

    image: wrapChannel(
      { channelName: 'hitl', messageType: 'image' },
      async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
        const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
          ticketId,
          zendeskAuthorId,
          payload.imageUrl
        )
        await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
      }
    ),

    audio: wrapChannel(
      { channelName: 'hitl', messageType: 'audio' },
      async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
        const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
          ticketId,
          zendeskAuthorId,
          payload.audioUrl
        )
        await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
      }
    ),

    video: wrapChannel(
      { channelName: 'hitl', messageType: 'video' },
      async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
        const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
          ticketId,
          zendeskAuthorId,
          payload.videoUrl
        )
        await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
      }
    ),

    file: wrapChannel(
      { channelName: 'hitl', messageType: 'file' },
      async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
        const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
          ticketId,
          zendeskAuthorId,
          payload.fileUrl
        )
        await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
      }
    ),

    bloc: wrapChannel(
      { channelName: 'hitl', messageType: 'bloc' },
      async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
        for (const item of payload.items) {
          // oxlint-disable-next-line default-case
          switch (item.type) {
            case 'text':
              await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.text)
              break
            case 'markdown':
              await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.markdown)
              break
            case 'image':
              await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.imageUrl)
              break
            case 'video':
              await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.videoUrl)
              break
            case 'audio':
              await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.audioUrl)
              break
            case 'file':
              await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.fileUrl)
              break
            case 'location':
              const { title, address, latitude, longitude } = item.payload
              const messageParts = []

              if (title) {
                messageParts.push(title, '')
              }
              if (address) {
                messageParts.push(address, '')
              }
              messageParts.push(`Latitude: ${latitude}`, `Longitude: ${longitude}`)

              await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, messageParts.join('\n'))
              break
          }
        }

        await ack({ tags: {} })
      }
    ),
  },
}

