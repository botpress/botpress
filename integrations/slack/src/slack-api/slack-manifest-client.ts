import { z, RuntimeError } from '@botpress/sdk'
import * as SlackApiClient from '@slack/web-api'
import { REQUIRED_SLACK_SCOPES } from '../setup'
import { surfaceSlackErrors } from './error-handling'
import * as bp from '.botpress'

const BOT_EVENTS = [
  'message.im',
  'message.groups',
  'message.mpim',
  'message.channels',
  'reaction_added',
  'reaction_removed',
  'member_joined_channel',
  'member_left_channel',
  'team_join',
]

const manifestSchema = z.object({
  display_information: z.object({
    name: z.string(),
  }),
  features: z.object({
    bot_user: z.object({
      display_name: z.string(),
      always_online: z.boolean(),
    }),
  }),
  oauth_config: z.object({
    scopes: z.object({
      bot: z.array(z.string()),
    }),
    redirect_urls: z.array(z.string()),
    token_management_enabled: z.boolean(),
  }),
  settings: z.object({
    event_subscriptions: z.object({
      request_url: z.string(),
      bot_events: z.array(z.string()),
    }),
    interactivity: z.object({
      is_enabled: z.boolean(),
      request_url: z.string(),
    }),
    org_deploy_enabled: z.boolean(),
    socket_mode_enabled: z.boolean(),
  }),
})

const manifestCreateResponseSchema = z.object({
  ok: z.literal(true),
  app_id: z.string(),
  credentials: z.object({
    client_id: z.string(),
    client_secret: z.string(),
    signing_secret: z.string(),
    verification_token: z.string(),
  }),
  oauth_authorize_url: z.string(),
})

export type ManifestCreateResponse = z.infer<typeof manifestCreateResponseSchema>
export type SlackAppManifest = z.infer<typeof manifestSchema>

export class SlackManifestClient {
  private readonly _logger: bp.Logger
  private readonly _appConfigurationToken: string
  private readonly _slackApiClient: SlackApiClient.WebClient

  public constructor({ logger, appConfigurationToken }: bp.CommonHandlerProps & { appConfigurationToken: string }) {
    this._logger = logger
    this._appConfigurationToken = appConfigurationToken
    this._slackApiClient = new SlackApiClient.WebClient(appConfigurationToken)
  }

  public async validateManifest(manifest: SlackAppManifest) {
    surfaceSlackErrors({
      logger: this._logger,
      response: await this._slackApiClient.apps.manifest.validate({
        token: this._appConfigurationToken,
        manifest: JSON.stringify(manifest),
      }),
    })
  }

  public async createApp(manifest: SlackAppManifest): Promise<ManifestCreateResponse> {
    const response = surfaceSlackErrors<SlackApiClient.AppsManifestCreateResponse>({
      logger: this._logger,
      response: await this._slackApiClient.apps.manifest.create({
        token: this._appConfigurationToken,
        manifest: JSON.stringify(manifest),
      }),
    })

    const { data, success } = manifestCreateResponseSchema.safeParse(response)
    if (!success) {
      throw new RuntimeError(`Unexpected response from Slack manifest create API: ${JSON.stringify(response)}`)
    }
    return data
  }
}

export const buildSlackAppManifest = (webhookUrl: string, redirectUri: string, appName: string): SlackAppManifest => ({
  display_information: {
    name: appName,
  },
  features: {
    bot_user: {
      display_name: appName,
      always_online: true,
    },
  },
  oauth_config: {
    scopes: {
      bot: REQUIRED_SLACK_SCOPES,
    },
    redirect_urls: [redirectUri],
    token_management_enabled: true,
  },
  settings: {
    event_subscriptions: {
      request_url: webhookUrl,
      bot_events: BOT_EVENTS,
    },
    interactivity: {
      is_enabled: true,
      request_url: webhookUrl,
    },
    org_deploy_enabled: false,
    socket_mode_enabled: false,
  },
})
