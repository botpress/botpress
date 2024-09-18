import { z } from '@botpress/sdk'
import { send } from '../handler'
import { triggerSchema } from '../misc/messaging/triggers'
import { IntegrationProps } from '../misc/types'

type Actions = Exclude<keyof IntegrationProps['actions'], 'getUserData'>
type Props = Parameters<IntegrationProps['actions'][Actions]>[0]

export const customEvent: IntegrationProps['actions']['customEvent'] = async (props) =>
  sendTrigger(props)({
    type: 'custom-event',
    event: JSON.parse(props.input.event),
  })

export const showWebchat: IntegrationProps['actions']['showWebchat'] = async (props) =>
  sendTrigger(props)({
    type: 'webchat-visibility',
    visibility: 'show',
  })

export const hideWebchat: IntegrationProps['actions']['hideWebchat'] = async (props) =>
  sendTrigger(props)({
    type: 'webchat-visibility',
    visibility: 'hide',
  })

export const toggleWebchat: IntegrationProps['actions']['toggleWebchat'] = async (props) =>
  sendTrigger(props)({
    type: 'webchat-visibility',
    visibility: 'toggle',
  })

export const configWebchat: IntegrationProps['actions']['configWebchat'] = async (props) =>
  sendTrigger(props)({
    type: 'webchat-config',
    config: JSON.parse(props.input.config),
  })

const sendTrigger =
  ({ client, input, ctx }: Props) =>
  async (trigger: z.infer<typeof triggerSchema>) => {
    const { conversation } = await client.getConversation({ id: input.conversationId })

    await send({
      message: {
        type: 'trigger',
        trigger,
      },
      ctx,
      conversation,
      client,
    })

    return {}
  }
