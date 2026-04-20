import type * as client from '@botpress/client'
import type { GetMessages } from '../../bot'
import type { commonTypes } from '../../common'
import type { AsyncCollection } from '../../utils/api-paging-utils'
import type * as typeUtils from '../../utils/type-utils'
import type { BasePlugin } from '../common'
import type { IncomingMessages } from '../server'

export type MessageFinder<TPlugin extends BasePlugin> = {
  list: (props?: Omit<client.ClientInputs['listMessages'], 'nextToken'>) => AsyncCollection<ActionableMessage<TPlugin>>
  getById: (props: { id: string }) => Promise<ActionableMessage<TPlugin>>
}

export type AnyPluginMessage<TPlugin extends BasePlugin> =
  | IncomingMessages<TPlugin>['*']
  | IncomingMessages<TPlugin>[typeUtils.StringKeys<GetMessages<TPlugin>>]

export type ActionableMessage<
  TPlugin extends BasePlugin,
  TMessage extends client.Message | AnyPluginMessage<TPlugin> = client.Message,
> = typeUtils.Merge<
  TMessage,
  {
    tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['conversation']['tags']>>
  }
> & {
  delete: () => Promise<void>
  update: (
    props: typeUtils.Merge<
      Omit<client.ClientInputs['updateMessage'], 'id'>,
      { tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['message']['tags']>> }
    >
  ) => Promise<ActionableMessage<TPlugin, TMessage>>
}
