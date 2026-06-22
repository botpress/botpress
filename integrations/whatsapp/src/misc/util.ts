import * as sdk from '@botpress/sdk'
import { AtLeastOne } from 'whatsapp-api-js/lib/utils'
import * as bp from '.botpress'

type Message = Awaited<ReturnType<bp.Client['listMessages']>>['messages'][number]

export function chunkArray<T>(array: T[], chunkSize: number) {
  const chunks: T[][] = []
  if (chunkSize <= 0) {
    return chunks
  }

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }

  return chunks
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function truncate(input: string, maxLength: number) {
  let truncated = input.substring(0, maxLength)
  if (truncated.length < input.length) {
    truncated = truncated.substring(0, maxLength - 1) + '…'
  }
  return truncated
}

export function getSubpath(path: string) {
  let subpath = '/' + path.split('/').slice(2).join('/')
  if (subpath.slice(-1) === '/') {
    subpath = subpath.slice(0, -1)
  }
  return subpath ? subpath : undefined
}
export const hasAtleastOne = <T>(obj: T[]): obj is AtLeastOne<T> => {
  return obj.length > 0
}

export const getMessageFromWhatsappMessageId = async (
  messageId: string,
  client: bp.Client
): Promise<Message | undefined> => {
  const { messages } = await client.listMessages({
    tags: {
      id: messageId,
    },
  })
  return messages[0]
}

export function logForBotAndThrow(message: string, logger: bp.Logger): never {
  logger.forBot().error(message)
  throw new sdk.RuntimeError(message)
}

type IssueLogEvent = Parameters<bp.Logger['issue']>[0]
type ReportIssueOptions = Omit<IssueLogEvent, 'type' | 'groupBy' | 'data'> & {
  /** Defaults to `[code]`. */
  groupBy?: string[]
  /** Defaults to `{}`. */
  data?: IssueLogEvent['data']
  /** Message for the thrown RuntimeError. Defaults to `description`. */
  throwMessage?: string
}

/**
 * Logs the error for the bot, reports a structured issue (so it surfaces in Desk),
 * then throws a RuntimeError so the failure is never silently swallowed.
 */
export function reportIssueAndThrow(
  logger: bp.Logger,
  { throwMessage, groupBy, data, ...issue }: ReportIssueOptions
): never {
  logger.forBot().error(issue.description)
  logger.issue({
    ...issue,
    type: 'issue',
    groupBy: groupBy ?? [issue.code],
    data: data ?? {},
  })
  throw new sdk.RuntimeError(throwMessage ?? issue.description)
}
