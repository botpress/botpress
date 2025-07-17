import 'dotenv/config'
import * as sdk from '@botpress/sdk'
import Imap from 'imap'
import { EmailThread, EmailMessage } from 'integration.definition'

const MAX_LOOP_COUNT = 100

type GetMessagesProps = {
  ctx: any
  client?: any
  input?: any
}

export const getMessages = async function (range: string, props: GetMessagesProps): Promise<EmailThread[]> {
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

  return threadMessages(messages)
}

const handleFetch = function (imap: Imap, f: Imap.ImapFetch, messages: EmailMessage[]) {
  f.on('message', (msg: Imap.ImapMessage) => {
    let uid: string = ''
    let subject: string = ''
    let body: string = ''
    let inReplyTo: string | undefined
    let date: Date | undefined
    let sender: string

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
            const parsedHeader = Imap.parseHeader(headerBuffer)
            subject = (parsedHeader.subject || ['']).join(' ')
            sender = (parsedHeader.from || ['']).join(' ')
            sender = sender.substring(sender.indexOf('<') + 1, sender.lastIndexOf('>'))

            inReplyTo = parsedHeader['in-reply-to']?.[0]
            if (!parsedHeader['message-id']?.[0]) {
              throw new sdk.RuntimeError('Email message is missing a message-id (uid)')
            }
            uid = parsedHeader['message-id']?.[0]
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
          })
        }
      })
    })
  })
  f.once('end', function () {
    imap.end()
  })
}

const threadMessages = function (messages: EmailMessage[]): EmailThread[] {
  const threads: EmailThread[] = []

  // on boucle sur tous les messages
  // pour ceux qui n'ont pas de inreplyto, on les ajoute dans la liste de threads et on les retire de la liste de messages
  // si on trouve thread avec le dernier message qui a comme id le inreplyto du message courant, on l'ajoute a la fin
  // on boucle jusqu'a ce que la liste soit vide
  let i: number = 0
  let loopCount = 0
  while (messages.length > 0) {
    loopCount += 1
    console.log(`loop count: ${loopCount}`)
    console.log(messages)
    const currentMessage = messages[i]!
    let messageDeleted: boolean = false
    if (currentMessage.inReplyTo === undefined) {
      threads.push([{ ...currentMessage }])
      messages.splice(i, 1)
      messageDeleted = true
    } else {
      for (const thread of threads) {
        if (thread[thread.length - 1]?.id === currentMessage.inReplyTo) {
          thread.push({ ...currentMessage })
          messages.splice(i, 1)
          messageDeleted = true
        }
      }
    }
    if (!messageDeleted) i = (i + 1) % messages.length
    // if (loopCount > MAX_LOOP_COUNT) {
    //   for (const message of messages) {
    //     threads.push([{ ...message }])
    //   }
    //   return threads
    // }
  }

  return threads
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
