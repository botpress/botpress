import type * as client from '@botpress/client'
import type { BotSpecificClient } from '../../bot'

import { createAsyncCollection } from '../../utils/api-paging-utils'
import { notFoundErrorToUndefined } from '../../utils/error-utils'
import type { BasePlugin, PluginRuntimeProps } from '../common'
import { prefixTagsIfNeeded, unprefixTagsOwnedByPlugin } from '../tag-prefixer'
import type { ActionableMessage, AnyPluginMessage, MessageFinder } from './types'

export const proxyMessages = <TPlugin extends BasePlugin>(props: {
  client: BotSpecificClient<TPlugin> | client.Client
  plugin?: PluginRuntimeProps<TPlugin>
}): MessageFinder<TPlugin> => ({
  async getById({ id }) {
    const response = await notFoundErrorToUndefined(
      props.client.getMessage({ id }) as Promise<client.ClientOutputs['getMessage']>
    )
    return response ? proxyMessage({ ...props, message: response.message as client.Message }) : undefined
  },

  list(listProps) {
    return createAsyncCollection(({ nextToken }) =>
      props.client
        .listMessages({
          ...prefixTagsIfNeeded(listProps, { alias: props.plugin?.alias }),
          nextToken,
        })
        .then(({ meta, messages }) => ({
          meta,
          items: messages.map((message) => proxyMessage({ ...props, message })),
        }))
    )
  },
})

export const proxyMessage = <
  TPlugin extends BasePlugin,
  TMessage extends client.Message | AnyPluginMessage<TPlugin> = AnyPluginMessage<TPlugin>,
>(props: {
  client: BotSpecificClient<TPlugin> | client.Client
  plugin?: PluginRuntimeProps<TPlugin>
  message: TMessage
}): ActionableMessage<TPlugin, TMessage> => ({
  ...unprefixTagsOwnedByPlugin(props.message, { alias: props.plugin?.alias }),

  async delete() {
    await props.client.deleteMessage({ id: props.message.id })
  },

  async update(data) {
    const { message: updatedMessage } = await props.client.updateMessage({
      ...prefixTagsIfNeeded(data, { alias: props.plugin?.alias }),
      id: props.message.id,
    })

    return proxyMessage({ ...props, message: updatedMessage as TMessage })
  },
})
