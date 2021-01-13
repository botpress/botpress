import { Request, Response, Router, json } from 'express';
import { ViberClient, ViberTypes } from 'messaging-api-viber';

import _ from 'lodash';

import { Config } from '../config';
import { Client } from './client';

import * as sdk from 'botpress/sdk';
import * as http from 'http';

const debug = DEBUG('channel-viber');
const debugIncoming = debug.sub('incoming');
const debugOutgoing = debug.sub('outgoing');


interface MountedBot {
  botId: string
  client: Client
}

export class ViberService {
  private mountedBots: MountedBot[] = [];
  private appSecret: string;
  private router: Router & sdk.http.RouterExtension;

  constructor(private bp: typeof sdk) {
  }

  private handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback): void {
    if (event.channel !== 'viber') {
      return next();
    }
    const messageType = event.type === 'default' ? 'text' : event.type;
    const client = this.mountedBots[0].client;
    next(undefined, false);
  }

  private handleIncomingEvent(req, res): void {
  }

  private getConfig(): Promise<Config> {
    return this.bp.config.getModuleConfig('channel-viber');
  }

  private async handleIncomingMessage(req: Request, res: Response): Promise<Response> {
    const body = req.body;
    if (body.event === 'message') {
      // this.mountedBots[0].client.sendMessage(
      //   body.sender,
      //   body.message,
      // );
    }
    return res.send();
  }

  public async initialize(): Promise<void> {
    const config = await this.getConfig();

    if (!config.verifyToken?.length || config.verifyToken === 'verify_token') {
      throw new Error('You need to set a valid value for "verifyToken" in data/global/config/channel-viber.json');
    }

    if (!config.appSecret?.length || config.appSecret === 'app_secret') {
      throw new Error('You need to set a valid value for "appSecret" in data/global/config/channel-viber.json');
    }

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

    this.bp.events.registerMiddleware({
      description: 'Sends outgoing messages for the viber channel',
      direction: 'outgoing',
      handler: this.handleOutgoingEvent.bind(this),
      name: 'viber.sendMessages',
      order: 200
    });
  }

  async mountBot(botId: string): Promise<void> {
    try {
      this.router.post('/webhook', this.handleIncomingMessage.bind(this));
      const config = await this.getConfig();
      const webhookPath = ((await this.router.getPublicPath()) + '/webhook').replace('BOT_ID', botId);
      const viberClient = new ViberClient(
        {
          accessToken: '4ca2b2be59000d19-b49363357bf1b496-c941a1ab955b7eb6',
          sender: {
            name: config.name || 'mfksdwef',
            avatar: config.avatar || ''
          },
          origin: config.origin,
        }
      );
      await viberClient.setWebhook(
        'https://7bea06616933.ngrok.io/api/v1/bots/tstqwe/mod/channel-viber/webhook',
        {
          eventTypes: [ViberTypes.EventType.Delivered, ViberTypes.EventType.Seen]
        }
      );
      const client = new Client(viberClient);
      this.mountedBots.push({ client, botId });
    } catch (e) {
      console.log(e);
    }
  }

  async unmountBot(botId: string) {
    this.mountedBots = _.remove(this.mountedBots, x => x.botId === botId);
  }
}
