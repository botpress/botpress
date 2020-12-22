import _ from 'lodash'
import { ViberClient } from 'messaging-api-viber'

import * as sdk from 'botpress/sdk'

import { Config } from '../config'
import { Client } from './client'

const debug = DEBUG('channel-viber')
const debugMessages = debug.sub('messages')
const debugHttp = debug.sub('http')
const debugWebhook = debugHttp.sub('webhook')
const debugHttpOut = debugHttp.sub('out')

interface MountedBot {
  botId: string
  client: Client
}

export class ViberService {
  private mountedBots: MountedBot[] = []
  private appSecret: string

  constructor(private bp: typeof sdk) {
  }

  private handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback): void {
    if (event.channel !== 'viber') {
      return next()
    }
  }

  private handleIncomingEvent(req, res): void {
  }

  private getConfig(): Promise<Config> {
    return this.bp.config.getModuleConfig('channel-viber')
  }

  public async initialize(): Promise<void> {
    const config = await this.getConfig()

    if (!config.verifyToken?.length || config.verifyToken === 'verify_token') {
      throw new Error('You need to set a valid value for "verifyToken" in data/global/config/channel-viber.json')
    }

    if (!config.appSecret?.length || config.appSecret === 'app_secret') {
      throw new Error('You need to set a valid value for "appSecret" in data/global/config/channel-viber.json')
    }

    this.appSecret = config.appSecret
  }

  async mountBot(botId: string): Promise<void> {
    const config = await this.getConfig()
    const viberClient = new ViberClient(
      {
        accessToken: '4ca2b2be59000d19-b49363357bf1b496-c941a1ab955b7eb6',
        sender: {
          name: config.name || 'mfksdwef',
          avatar: config.avatar || ''
        },
        origin: config.origin,
      }
    )
    const client = new Client(viberClient)
    this.mountedBots.push({ client, botId })
  }

  async unmountBot(botId: string) {
    this.mountedBots = _.remove(this.mountedBots, x => x.botId === botId)
  }
}
