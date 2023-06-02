import bluebird from 'bluebird'
import { casing } from '../utils'
import { MessageModule } from './message'
import { ReExportTypeModule } from './module'
import type { Channel } from './typings'

export class ChannelModule extends ReExportTypeModule {
  public static async create(channelName: string, channel: Channel): Promise<ChannelModule> {
    const messages = channel.messages ?? {}
    const messageModules = await bluebird.map(Object.entries(messages), ([messageName, message]) =>
      MessageModule.create(messageName, message)
    )

    const inst = new ChannelModule({
      exportName: `Channel${casing.to.pascalCase(channelName)}`,
    })
    inst.pushDep(...messageModules)
    return inst
  }
}
