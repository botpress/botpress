import { UserResolverWithCaching } from '../user-resolver'
import { MessageFormatter, MessageTextExtractor, MessageTextOutput } from './message-formatter'
import { Message } from './message-types'

export type TranscriptFormatter = (extractedMessages: MessageTextOutput[]) => Promise<string> | string

export const buildConversationTranscript = async ({
  messages,
  ctx,
  client,
  customMessageFormatters,
  customTranscriptFormatter,
}: {
  ctx: { botUserId: string }
  client: ConstructorParameters<typeof UserResolverWithCaching>[0]
  messages: Message[]
  customMessageFormatters?: { [K in Message['type']]?: MessageFormatter }
  customTranscriptFormatter?: TranscriptFormatter
}): Promise<string> => {
  const messageExtractor = new MessageTextExtractor({
    botUserId: ctx.botUserId,
    customFormatters: customMessageFormatters,
    userResolver: new UserResolverWithCaching(client),
  })

  const extractedMessages = await messageExtractor.extractTextFromMessages(messages)
  const transcriptFormatter = customTranscriptFormatter ?? DEFAULT_TRANSCRIPT_FORMATTER
  const transcript = await transcriptFormatter(extractedMessages)

  return transcript
}

const DEFAULT_TRANSCRIPT_FORMATTER: TranscriptFormatter = (extractedMessages) => {
  const formattedMessages = extractedMessages.map((message) => {
    const emoji = message.isBot ? '🤖' : '👤'
    const name = message.user.name ?? (message.isBot ? 'Botpress' : 'User')
    const header = `${emoji} ${name}:`
    const body = message.text.join('\n')

    return `${header}\n${body}`
  })

  return formattedMessages.join('\n\n---\n\n')
}
