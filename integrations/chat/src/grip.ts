type WebSocketEvent =
  | {
      type: 'open'
    }
  | {
      type: 'text'
      content: string
    }
  | {
      type: 'binary'
      content: Buffer
    }
  | {
      type: 'close'
      code: number
    }
  | {
      type: 'disconnect'
    }

const _serializeSingleWebSocketEvent = (event: WebSocketEvent): Buffer => {
  let content = Buffer.from('')
  if (event.type === 'text') {
    content = Buffer.from(event.content, 'utf8')
  } else if (event.type === 'binary') {
    content = Buffer.from(event.content)
  } else if (event.type === 'close') {
    content = Buffer.alloc(2)
    content.writeUInt16BE(event.code)
  }

  if (content.length === 0) {
    return Buffer.from(event.type.toUpperCase() + '\r\n')
  }
  return Buffer.concat([
    Buffer.from(event.type.toUpperCase() + ` ${content.length.toString(16)}\r\n`),
    content,
    Buffer.from('\r\n'),
  ])
}

export const serializeWebSocketEvents = (events: WebSocketEvent[]): Buffer => {
  return Buffer.concat(events.map(_serializeSingleWebSocketEvent))
}

export const parseWebSocketEvents = (body: Buffer): WebSocketEvent[] => {
  const events: WebSocketEvent[] = []
  while (body.length > 0) {
    const endLineIndex = body.findIndex((byte, i, array) => {
      if (array.length > i) {
        return byte === '\r'.charCodeAt(0) && array[i + 1] === '\n'.charCodeAt(0)
      }
      return false
    })
    if (endLineIndex === -1) {
      throw new Error('Could not parse body')
    }

    const command = body.subarray(0, endLineIndex).toString()
    const [type, _length] = command.split(/\s(.*)/s)

    if (!['OPEN', 'CLOSE', 'DISCONNECT', 'TEXT', 'BINARY'].includes(type ?? '')) {
      throw new Error(`'${type}' is not a valid command`)
    }

    let length = parseInt(_length ?? '0', 16)
    if (length && isNaN(length)) {
      length = 0
    }
    const content = body.subarray(endLineIndex + 2, endLineIndex + 2 + length)
    if (type === 'OPEN') {
      events.push({ type: 'open' })
    } else if (type === 'DISCONNECT') {
      events.push({ type: 'disconnect' })
    } else if (type === 'TEXT') {
      events.push({
        type: 'text',
        content: content.toString(),
      })
    } else if (type === 'BINARY') {
      events.push({
        type: 'binary',
        content,
      })
    } else if (type === 'CLOSE') {
      if (length === 2) {
        events.push({
          type: 'close',
          code: content.readUInt16BE(0),
        })
      }
    }
    body = body.subarray(endLineIndex + 2 + length + 2)
  }
  return events
}

export const openAndSubscribeBody = (channels: string | string[]) => {
  channels = typeof channels === 'string' ? [channels] : channels
  return serializeWebSocketEvents([
    {
      type: 'open',
    },
    ...channels.map((channel) => ({
      type: 'text' as const,
      content: `c:${JSON.stringify({ type: 'subscribe', channel })}`,
    })),
  ])
}
