import { Request, Response, Router, json } from 'express';
import { ViberClient } from 'messaging-api-viber';

import _ from 'lodash';

import * as sdk from 'botpress/sdk';
import * as http from 'http';

const debug = DEBUG('channel-viber');
const debugIncoming = debug.sub('incoming');
const debugOutgoing = debug.sub('outgoing');

import { Config } from '../config';
import { Client } from './client';

interface MountedBot {
  botId: string
  client: Client
}

enum EventType {
  Delivered = 'delivered',
  Seen = 'seen',
  Failed = 'failed',
  Subscribed = 'subscribed',
  Unsubscribed = 'unsubscribed',
  ConversationStarted = 'conversation_started'
}

export class ViberService {
  private mountedBots: MountedBot[] = [];
  private appSecret: string;
  private router: Router & sdk.http.RouterExtension;

  constructor(private bp: typeof sdk) {
  }

  private async handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback): Promise<void> {
    if (event.channel !== 'viber') {
      return next();
    }

    console.log('event');
    console.log(event);
    console.log('event');

    const messageType = event.type === 'default' ? 'text' : event.type;
    const client = this.mountedBots[0].client;

    if (messageType === 'text') {
      if (event.payload?.text) {
        // @ts-ignore
        await client.sendMessage({
          id: event.target
        }, event.payload)
      } else if (event.payload?.options?.Type === 'keyboard') {
        // @ts-ignore
        await client.sendText({
          id: event.target
        }, event.payload.title, {
          keyboard: {
            type: 'keyboard',
            buttons: event.payload.options.Buttons
          }
        });
      }
    }

    next(undefined, false);
  }

  private getConfig(): Promise<Config> {
    return this.bp.config.getModuleConfig('channel-viber');
  }

  private async handleIncomingMessage(req: Request, res: Response): Promise<Response> {
    const { message, event, sender } = req.body;
    console.log('req.body');
    console.log(req.body);
    console.log('req.body');
    if (event === 'message') {
      await this.bp.events.sendEvent(
        this.bp.IO.Event({
          botId: 'ecbv2',
          channel: 'viber',
          direction: 'incoming',
          payload: message,
          preview: message.text,
          target: sender.id,
          type: message.type,
        })
      );
    }
    return res.send();
  }

  public async initialize(): Promise<void> {
    const config = await this.getConfig();

    // if (!config.verifyToken?.length || config.verifyToken === 'verify_token') {
    //   throw new Error('You need to set a valid value for "verifyToken" in data/global/config/channel-viber.json');
    // }

    // if (!config.appSecret?.length || config.appSecret === 'app_secret') {
    //   throw new Error('You need to set a valid value for "appSecret" in data/global/config/channel-viber.json');
    // }

    this.appSecret = config.appSecret;

    this.router = this.bp.http.createRouterForBot('channel-viber', {
      checkAuthentication: false,
      enableJsonBodyParser: false // we use our custom json body parser instead, see below
    });

    const publicPath = await this.router.getPublicPath();
    if (!publicPath.startsWith('https://')) {
      this.bp.logger.warn('Viber requires HTTPS to be setup to work properly. See EXTERNAL_URL botpress config.');
    }
    this.bp.logger.info(`Viber Webhook URL is ${publicPath.replace('BOT_ID', '___')}/webhook`);

    this.router.use(json());

    this.router.post('/webhook', this.handleIncomingMessage.bind(this));
    this.bp.events.registerMiddleware({
      description: 'Sends outgoing messages for the viber channel',
      direction: 'outgoing',
      handler: this.handleOutgoingEvent.bind(this),
      name: 'viber.sendMessages',
      order: 200
    });
  }

  public async mountBot(botId: string): Promise<void> {
    try {
      const config = await this.getConfig();
      const webhookPath = ((await this.router.getPublicPath()) + '/webhook').replace('BOT_ID', botId);
      const viberClient = new ViberClient(
        {
          accessToken: config.accessToken,
          sender: {
            name: config.name || 'mfksdwef',
            avatar: config.avatar || ''
          },
          origin: config.origin,
        }
      );
      await viberClient.setWebhook(
        'https://4f22e34b9654.ngrok.io/api/v1/bots/ecbv2/mod/channel-viber/webhook',
        {
          eventTypes: [EventType.Delivered, EventType.Seen],
        }
      );
      const client = new Client(viberClient);
      this.mountedBots.push({ client, botId });
    } catch (e) {
      const errorMessage = _.get(e, 'response.data.error.message', 'are you sure your Access Token is valid?')
      return this.bp.logger
        .forBot(botId)
        .error(`Could not register bot, ${errorMessage}. Viber Channel is disabled for this bot.`)

    }
  }

  public async unmountBot(botId: string) {
    this.mountedBots = _.remove(this.mountedBots, x => x.botId === botId);
  }
}
