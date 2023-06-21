import z from 'zod'
import { send } from '../handler'
import { triggerSchema } from '../misc/messaging/triggers'
import { Implementation } from '../misc/types'

type Actions = Exclude<keyof Implementation['actions'], 'getUserData'>
type Props = Parameters<Implementation['actions'][Actions]>[0]

export const customEvent: Implementation['actions']['customEvent'] = async (props) =>
  sendTrigger(props)({
    type: 'custom-event',
    event: JSON.parse(props.input.event),
  })

export const showWebchat: Implementation['actions']['showWebchat'] = async (props) =>
  sendTrigger(props)({
    type: 'webchat-visibility',
    visibility: 'show',
  })

export const hideWebchat: Implementation['actions']['hideWebchat'] = async (props) =>
  sendTrigger(props)({
    type: 'webchat-visibility',
    visibility: 'hide',
  })

export const toggleWebchat: Implementation['actions']['toggleWebchat'] = async (props) =>
  sendTrigger(props)({
    type: 'webchat-visibility',
    visibility: 'toggle',
  })

export const configWebchat: Implementation['actions']['configWebchat'] = async (props) =>
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
