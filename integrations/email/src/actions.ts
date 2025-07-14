import * as sdk from '@botpress/sdk'
import Imap from 'imap'
import 'dotenv/config'
import nodemailer from 'nodemailer'
import * as bp from '.botpress'

const config = {
  user: '',
  password: '',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
}

export const actions = {
  listEmails: async (props) => {
    const messages = await getMessages('1:*', props)

    return { messages: messages.flat() }
  },

  syncEmails: async (props) => {
    const messages = await getMessages('1:*', props)

    const ids = []
    for (const { id } of messages) {
      ids.push({ id })
    }
    const seenMessages = await props.client.getOrSetState({
      name: 'seenMails',
      id: props.ctx.integrationId,
      type: 'integration',
      payload: { seenMails: [] },
    })

    const unseenMessages = []
    for (const { id, subject, inReplyTo, body, date } of messages) {
      if (!seenMessages.state.payload.seenMails.some((mail: { id: string }) => mail.id === id)) {
        unseenMessages.push({ id, subject, inReplyTo, body, date }) // Include inReplyTo
      }
    }
    await props.client.setState({
      name: 'seenMails',
      id: props.ctx.integrationId,
      type: 'integration',
      payload: { seenMails: ids },
    })

    return { messages: unseenMessages }
  },
  sendMail: async (props) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: props.ctx.configuration.user,
        pass: props.ctx.configuration.password,
      },
    })

    await transporter.sendMail({
      from: props.input.from, //TODO from does not work
      to: props.input.to,
      subject: props.input.subject,
      text: props.input.text,
    })
    return { message: 'Success' }
  },
} as const satisfies bp.IntegrationProps['actions']

interface Message {
  id: string
  subject: string
  body: string
  inReplyTo?: string
  date?: Date
}

interface GetMessagesProps {
  ctx: any
  client?: any
  input?: any
}

const getMessages = async function (range: string, props: GetMessagesProps): Promise<Message[]> {
  const messages: Message[] = []
  getConfig(props.ctx)
  const imap: Imap = new Imap(config)

  function openInbox(cb: (err: any, box: any) => void): void {
    imap.openBox('INBOX', true, cb)
  }

  const messageFetchPromise: Promise<void> = new Promise<void>((resolve, reject) => {
    imap.once('ready', function () {
      openInbox((err: any, box: any) => {
        if (err) return reject(new sdk.RuntimeError(err))

        const f: Imap.ImapFetch = imap.seq.fetch(range, {
          bodies: ['HEADER', 'TEXT'],
          struct: true,
        })

        f.on('message', (msg: Imap.ImapMessage, seqno: number) => {
          const uid: string = seqno.toString()
          let subject: string = ''
          let body: string = ''
          let inReplyTo: string | undefined
          let date: Date | undefined

          let headerBuffer: string = ''

          msg.on('body', (stream: NodeJS.ReadableStream, info: any) => {
            let buffer = ''
            stream.on('data', function (chunk: any) {
              buffer += chunk.toString('utf8')
            })
            stream.once('end', function () {
              if (info.which === 'HEADER') {
                headerBuffer = buffer // Store the header buffer
                try {
                  const parsedHeader = Imap.parseHeader(headerBuffer)
                  subject = (parsedHeader.subject || ['']).join(' ')

                  inReplyTo = parsedHeader['in-reply-to']?.[0]
                  if (parsedHeader.date && parsedHeader.date.length > 0) {
                    date = parsedHeader.date[0] !== undefined ? new Date(parsedHeader.date[0]) : undefined
                  }
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
            // ... (same as above)
            stream.once('end', () => {
              partsProcessed++
              if (partsProcessed === totalParts) {
                // All parts for this message have been processed
                messages.push({
                  id: uid,
                  subject,
                  body,
                  inReplyTo, // Include inReplyTo here
                  date,
                })
              }
            })
          })
        })

        f.once('end', function () {
          imap.end()
        })
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

const getConfig = function (ctx: any) {
  config.user = ctx.user || process.env.IMAP_USER
  config.password = ctx.password || process.env.IMAP_PASSWORD
  return config
}
