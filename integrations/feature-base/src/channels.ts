import { FeatureBaseClient } from './client'
import * as bp from '.botpress'

export type MessageHandlerProps<T extends keyof bp.MessageProps['comments']> = bp.MessageProps['comments'][T]

export const handleTextMessage = async (props: MessageHandlerProps<'text'>) => {
  // props.conversation.tags.parentCommentId
  // props.conversation.tags.submissionId
  // props.conversation.tags.changelogId

  const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
  await client.createComment({
    content: props.payload.text,
    ...props.conversation.tags,
  })
  props.ack({ tags: props.conversation.tags })
}

// export const handleImageMessage;
