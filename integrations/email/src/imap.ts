import 'dotenv/config'
import * as sdk from '@botpress/sdk'
import Imap from 'imap'
import * as bp from '.botpress'

type HeaderData = {
  id: string
  subject: string
  inReplyTo: string | undefined
  date: Date | undefined
  sender: string
  firstMessageId: string | undefined
}

export const getMessages = async function (
  range: string,
  props: { integrationConfig: bp.configuration.Configuration; logger: bp.Logger }
): Promise<bp.actions.listEmails.output.Output['messages']> {
  const messages: bp.actions.listEmails.output.Output['messages'] = []
  const imap: Imap = new Imap(getConfig(props.integrationConfig))

  function openInbox(cb: (err: Error, box: Imap.Box) => void): void {
    imap.openBox('INBOX', true, cb)
  }

  const messageFetchPromise: Promise<void> = new Promise<void>((resolve, reject) => {
    imap.once('ready', function () {
      openInbox((err) => {
        if (err)
          return reject(
            new sdk.RuntimeError(
              'An error occured while opening the inbox. Verify the integration configuration parameters.',
              err
            )
          )

        const f: Imap.ImapFetch = imap.seq.fetch(range, {
          bodies: ['HEADER', 'TEXT'],
          struct: true,
        })

        handleFetch(imap, f, messages)
      })
    })

    imap.once('end', () => {
      resolve()
    })

    imap.once('error', (err: Error) => {
      reject(new sdk.RuntimeError('An error occured while reading the inbox.', err))
    })

    imap.connect()
  })

  await messageFetchPromise

  props.logger.forBot().info('Finished reading all messages in inbox.')

  return messages
}

const handleFetch = function (
  imap: Imap,
  f: Imap.ImapFetch,
  messages: bp.actions.listEmails.output.Output['messages']
) {
  f.on('message', (msg: Imap.ImapMessage) => {
    let headerData: HeaderData
    let body: string

    msg.on('body', (stream: NodeJS.ReadableStream, info) => {
      let buffer = ''
      stream.on('data', function (chunk) {
        buffer += chunk.toString('utf8')
      })
      stream.once('end', function () {
        if (info.which === 'HEADER') {
          headerData = parseHeader(buffer)
        } else if (info.which === 'TEXT') {
          body = buffer
        }
      })
    })

    let partsProcessed = 0
    const totalParts = 2 // For HEADER and TEXT

    msg.on('body', (stream: NodeJS.ReadableStream) => {
      stream.once('end', () => {
        partsProcessed++
        if (partsProcessed === totalParts) {
          // All parts for this message have been processed
          messages.push({
            ...headerData,
            body,
          })
        }
      })
    })
  })
  f.once('end', function () {
    imap.end()
  })
}

const getConfig = function (config: bp.configuration.Configuration) {
  return {
    user: config.user,
    password: config.password,
    host: config.host,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  }
}

function getStringBetweenAngles(input: string): string | undefined {
  const start = input.indexOf('<')
  const end = input.indexOf('>')
  if (start !== -1 && end !== -1 && end > start) {
    return input.substring(start, end + 1)
  }
  return undefined
}

const parseHeader = (buffer: string): HeaderData => {
  const headerBuffer = buffer
  let subject = '',
    sender = '',
    id = ''
  let inReplyTo: string | undefined, firstMessageId: string | undefined
  let date: Date | undefined

  try {
    const parsedHeader = Imap.parseHeader(headerBuffer)
    subject = (parsedHeader.subject || ['']).join(' ')
    sender = (parsedHeader.from || ['']).join(' ')
    if (sender.includes('<') && sender.includes('>')) {
      sender = sender.substring(sender.indexOf('<') + 1, sender.lastIndexOf('>'))
    }

    inReplyTo = parsedHeader['in-reply-to']?.[0]
    if (!parsedHeader['message-id']?.[0]) {
      throw new sdk.RuntimeError('Email message is missing a message-id (uid)')
    }
    id = parsedHeader['message-id']?.[0]
    if (parsedHeader.date && parsedHeader.date.length > 0) {
      date = parsedHeader.date[0] !== undefined ? new Date(parsedHeader.date[0]) : undefined
    }
    const references = parsedHeader['references']?.[0]
    if (references) {
      firstMessageId = getStringBetweenAngles(references)
    }
  } catch (e) {
    console.error('Error parsing header:', e)
  }
  return { date, firstMessageId, id, inReplyTo, sender, subject }
}
