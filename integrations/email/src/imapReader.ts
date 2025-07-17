import 'dotenv/config'
import * as sdk from '@botpress/sdk'
import Imap from 'imap'
import { EmailMessage } from 'integration.definition'

type GetMessagesProps = {
  ctx: any
  client?: any
  input?: any
}

export const getMessages = async function (range: string, props: GetMessagesProps): Promise<EmailMessage[]> {
  const messages: EmailMessage[] = []
  getConfig(props.ctx)
  const imap: Imap = new Imap(config)

  function openInbox(cb: (err: any, box: any) => void): void {
    imap.openBox('INBOX', true, cb)
  }

  const messageFetchPromise: Promise<void> = new Promise<void>((resolve, reject) => {
    imap.once('ready', function () {
      openInbox((err: any) => {
        if (err) return reject(new sdk.RuntimeError(err))

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

    imap.once('error', (err: any) => {
      reject(new sdk.RuntimeError(err))
    })

    imap.connect()
  })

  await messageFetchPromise

  return messages
}

const handleFetch = function (imap: Imap, f: Imap.ImapFetch, messages: EmailMessage[]) {
  f.on('message', (msg: Imap.ImapMessage, seqno: number) => {
    let uid: string = ''
    let subject: string = ''
    let body: string = ''
    let inReplyTo: string | undefined
    let date: Date | undefined
    let sender: string
    let firstMessageId: string | undefined

    let headerBuffer: string = ''

    msg.on('body', (stream: NodeJS.ReadableStream, info: any) => {
      let buffer = ''
      stream.on('data', function (chunk: any) {
        buffer += chunk.toString('utf8')
      })
      stream.once('end', function () {
        if (info.which === 'HEADER') {
          headerBuffer = buffer
          try {
            const headerResult = parseHeader(headerBuffer)
            subject = headerResult.subject
            sender = headerResult.sender
            inReplyTo = headerResult.inReplyTo
            uid = headerResult.uid
            firstMessageId = headerResult.firstMessageId
            date = headerResult.date
          } catch (e) {
            console.error('Error parsing header:', e)
          }
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
            id: uid,
            subject,
            body,
            inReplyTo,
            date,
            sender,
            firstMessageId,
          })
        }
      })
    })
  })
  f.once('end', function () {
    imap.end()
  })
}

const getConfig = function (ctx: any) {
  config.user = ctx.configuration.user || process.env.IMAP_USER
  config.password = ctx.configuration.password || process.env.IMAP_PASSWORD
  return config
}

const config = {
  user: '',
  password: '',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
}

function getStringBetweenAngles(input: string): string | undefined {
  const start = input.indexOf('<')
  const end = input.indexOf('>')
  if (start !== -1 && end !== -1 && end > start) {
    return input.substring(start, end + 1)
  }
  return undefined
}
