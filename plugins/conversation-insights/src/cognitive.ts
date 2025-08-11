import * as client from '../../../packages/cognitive'

type ConversationUpdate = {
  title: string
  summary: string
}

type CognitiveUpdateProps = {
  botId: string
  client: client.BotpressClientLike
  messages: string[]
}
export const getUpdate = async (props: CognitiveUpdateProps): Promise<ConversationUpdate> => {
  const cogn = new client.Cognitive({
    client: props.client,
  })

  console.log(props.messages)
  const formatMessages: { content: string; role: 'user' | 'assistant' }[] = props.messages.map((message) => ({
    content: message,
    role: 'user',
  }))

  const content = await cogn.generateContent({
    messages: formatMessages,
    systemPrompt: 'Write a title and summary of the messages',
  })
  console.log(content)

  return { title: content.output.model, summary: 'updatedSummary' }
}
