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

const getPageFromEnd = async (props: { page: number; perPage: number; totalMessages: number }) => {
  const start = props.page * props.perPage + 1
  const end = start + props.perPage - 1
  const range = `${start}:${end}`
  console.log(range) //TODO
  return range
}

export const getMessages = async function (
  range: { page: number; perPage: number },
  props: { integrationConfig: bp.configuration.Configuration; logger: bp.Logger },
  options?: { bodyNeeded: boolean }
): Promise<bp.actions.listEmails.output.Output['messages']> {
  const messages: bp.actions.listEmails.output.Output['messages'] = []
  const imap: Imap = new Imap(getConfig(props.integrationConfig))

  function openInbox(cb: (err: Error, box: Imap.Box) => void): void {
    imap.openBox('INBOX', true, cb)
  }

  const messageFetchPromise: Promise<void> = new Promise<void>((resolve, reject) => {
    let totalMessages: number
    imap.once('ready', function () {
      imap.status('INBOX', (err, box) => {
        if (err) {
          imap.end()
          return reject(new sdk.RuntimeError('An error occurred while fetching INBOX status for total messages.', err))
        }
        imap.end()
        totalMessages = box.messages.total
      })
      openInbox((err) => {
        if (err)
          return reject(
            new sdk.RuntimeError(
              'An error occured while opening the inbox. Verify the integration configuration parameters.',
              err
            )
          )
        const imapBodies = ['HEADER']
        if (options?.bodyNeeded || !options) imapBodies.push('TEXT')
        const actualRange = await getPageFromEnd({ page: range.page, perPage: range.perPage, totalMessages })
          .then((actualRange) => {
            const f: Imap.ImapFetch = imap.seq.fetch(actualRange, {
              bodies: imapBodies,
              struct: true,
            })

            handleFetch(imap, f, messages)
          })
          .catch(reject)
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
    host: config.imapHost,
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
