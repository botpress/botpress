import * as sdk from '@botpress/sdk'
import Imap from 'imap'
import * as paging from './paging'
import * as bp from '.botpress'

type HeaderData = {
  id: string
  subject: string
  inReplyTo: string | undefined
  date: string | undefined
  sender: string
  firstMessageId: string | undefined
}

const INBOX_ERROR_MESSAGE = 'An error occured while opening the inbox'

export type Email = bp.actions.listEmails.output.Output['messages'][0] & { body?: string }
export type EmailResponse = { messages: Array<Email> } & { nextToken?: string }

const _connectToImap = async (props: {
  ctx: bp.Context
  logger: bp.Logger
}): Promise<{ imap: Imap; box: Imap.Box }> => {
  const imap: Imap = new Imap(_getConfig(props.ctx.configuration))

  await new Promise<EmailResponse>((resolve, reject) => {
    imap.once('ready', resolve)
    imap.once('error', (err: Error) => {
      reject(new sdk.RuntimeError('An error occured while connecting to the inbox', err))
    })
    imap.connect()
  })

  return {
    imap,
    box: await new Promise<Imap.Box>((resolve, reject) => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(new sdk.RuntimeError(INBOX_ERROR_MESSAGE, err))
        } else {
          resolve(box)
        }
      })
    }),
  }
}

export const getMessages = async function (
  range: { page: number; perPage: number },
  props: { ctx: bp.Context; logger: bp.Logger },
  options?: { bodyNeeded: boolean }
): Promise<EmailResponse> {
  let messages: EmailResponse
  let imap: Imap | undefined = undefined
  let box: Imap.Box | undefined = undefined

  try {
    ;({ imap, box } = await _connectToImap(props))
    if (!imap || !box) throw new sdk.RuntimeError(INBOX_ERROR_MESSAGE)

    const imapBodies = ['HEADER']
    if (options?.bodyNeeded || !options) {
      imapBodies.push('TEXT')
    }

    const { firstElementIndex, lastElementIndex } = paging.pageToSpan({
      page: range.page,
      perPage: range.perPage,
      totalElements: box.messages.total,
    })

    if (firstElementIndex === 0 || lastElementIndex === 0) return { messages: [] }

    const imapRange = `${firstElementIndex}:${lastElementIndex}`
    const f: Imap.ImapFetch = imap.seq.fetch(imapRange, {
      bodies: imapBodies,
      struct: true,
    })
    const nextToken = paging.getNextToken({ page: range.page, firstElementIndex })?.toString()

    messages = { messages: await _handleFetch(imap, f, imapBodies.length), nextToken }
  } catch (thrown: unknown) {
    if (imap?.state !== 'disconnected') {
      imap?.end()
    }

    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new sdk.RuntimeError(
      'An error occured while opening the inbox or fetching messages. Verify the integration configuration parameters.',
      err
    )
  }

  props.logger.forBot().info(`Read ${messages.messages.length} messages from the inbox`)
  return messages
}

const _handleFetch = function (imap: Imap, f: Imap.ImapFetch, totalParts: number): Promise<Array<Email>> {
  const messages: Array<Email> = []
  return new Promise((resolve, reject) => {
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
            headerData = _parseHeader(buffer)
          } else if (info.which === 'TEXT') {
            body = buffer
          }
        })
      })

      let partsProcessed = 0

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

    f.once('error', (err) => {
      reject(new sdk.RuntimeError('An error occured while fetching messages', err))
    })

    f.once('end', function () {
      imap.end()
      resolve(messages)
    })
  })
}

export const getMessageById = async function (
  messageId: string,
  props: { ctx: bp.Context; logger: bp.Logger },
  options?: { bodyNeeded: boolean }
): Promise<Email | undefined> {
  let imap: Imap | undefined = undefined

  try {
    ;({ imap } = await _connectToImap(props))
    if (!imap) throw new sdk.RuntimeError('')

    const imapBodies = ['HEADER']
    if (options?.bodyNeeded || !options) {
      imapBodies.push('TEXT')
    }

    // Search for the message by message-id
    const searchCriteria = [['HEADER', 'MESSAGE-ID', messageId]]
    const uids: number[] = await new Promise((resolve, reject) => {
      if (!imap) throw new sdk.RuntimeError(INBOX_ERROR_MESSAGE)
      imap.search(searchCriteria, (err, results) => {
        if (err) {
          reject(new sdk.RuntimeError('An error occured while searching for the message', err))
        } else {
          resolve(results)
        }
      })
    })

    if (!uids || uids.length === 0) {
      imap.end()
      return undefined
    }

    const f: Imap.ImapFetch = imap.fetch(uids, {
      bodies: imapBodies,
      struct: true,
    })

    const messages = await _handleFetch(imap, f, imapBodies.length)
    return messages[0]
  } catch (thrown: unknown) {
    if (imap?.state !== 'disconnected') {
      imap?.end()
    }
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new sdk.RuntimeError('An error occured while searching for the message by message-id.', err)
  }
}

const _getConfig = function (config: bp.configuration.Configuration) {
  return {
    user: config.user,
    password: config.password,
    host: config.imapHost,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  }
}

function _getStringBetweenAngles(input: string): string | undefined {
  const start = input.indexOf('<')
  const end = input.indexOf('>')
  if (start !== -1 && end !== -1 && end > start) {
    return input.substring(start, end + 1)
  }
  return undefined
}

const _parseHeader = (buffer: string): HeaderData => {
  const headerBuffer = buffer

  let subject = ''
  let sender = ''
  let id = ''
  let inReplyTo: string | undefined
  let firstMessageId: string | undefined
  let date: string | undefined

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
      date = parsedHeader.date[0]
    }
    const references = parsedHeader['references']?.[0]
    if (references) {
      firstMessageId = _getStringBetweenAngles(references)
    }
  } catch (e) {
    console.error('Error parsing header:', e)
  }

  return { date, firstMessageId, id, inReplyTo, sender, subject }
}
