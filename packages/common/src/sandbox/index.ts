import { z, IntegrationProps } from '@botpress/sdk'
const supportedDynamicLinkingCommandsSchema = z.enum(['join', 'leave'])
type SupportedDynamicLinkingCommand = z.infer<typeof supportedDynamicLinkingCommandsSchema>
type HandlerProps = Parameters<IntegrationProps['handler']>[0]
type HandlerRequest = HandlerProps['req']

export const CONVERSATION_CONNECTED_MESSAGE =
  'Conversation connected to bot. You can now send messages. To disconnect, send this message: //leave'
export const CONVERSATION_DISCONNECTED_MESSAGE = 'Conversation disconnected from bot'

export const isSandboxCommand = (props: Pick<HandlerProps, 'req'>): boolean => {
  const { req } = props
  return extractSandboxCommand(req) !== undefined
}

export const extractSandboxCommand = (req: HandlerRequest): SupportedDynamicLinkingCommand | undefined => {
  const operation = req.headers['x-bp-sandbox-operation']
  if (!operation) {
    return undefined
  }
  const operationParseResult = supportedDynamicLinkingCommandsSchema.safeParse(operation)
  if (!operationParseResult.success) {
    return undefined
  }
  return operationParseResult.data
}
