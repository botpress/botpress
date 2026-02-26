import { z, RuntimeError } from '@botpress/sdk'
import { WebClient as SlackApiClient } from '@slack/web-api'
import { REQUIRED_SLACK_SCOPES } from '../setup'
import * as bp from '.botpress'

const SLACK_API_BASE = 'https://slack.com/api'

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

const slackErrorSchema = z.object({
  message: z.string(),
  pointer: z.string(),
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

const manifestErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string().optional(),
  errors: z.array(slackErrorSchema).optional(),
})

const manifestValidateSuccessSchema = z.object({
  ok: z.literal(true),
})

const manifestUpdateSuccessSchema = z.object({
  ok: z.literal(true),
})

export type ManifestCreateResponse = z.infer<typeof manifestCreateResponseSchema>

export class SlackManifestClient {
  private readonly _client: bp.Client
  private readonly _ctx: bp.Context
  private readonly _logger: bp.Logger
  private readonly _appConfigToken: string
  private readonly _slackApiClient: SlackApiClient

  public constructor({ client, ctx, logger, appConfigToken }: bp.CommonHandlerProps & { appConfigToken: string }) {
    this._client = client
    this._ctx = ctx
    this._logger = logger
    this._appConfigToken = appConfigToken
    this._slackApiClient = new SlackApiClient(appConfigToken)
    this._logger.forBot().debug('Initialized SlackManifestClient with config token', appConfigToken)
  }

  public async validateManifest(manifest: object): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
    const { data } = await this._slackApiClient.apiCall('apps.manifest.validate', {
      token: this._appConfigToken,
      manifest: JSON.stringify(manifest),
    })

    const successResult = manifestValidateSuccessSchema.safeParse(data)
    if (successResult.success) {
      return { ok: true }
    }

    const errorResult = manifestErrorResponseSchema.safeParse(data)
    if (errorResult.success) {
      const errorMessage =
        errorResult.data.errors?.map((e) => e.message).join(', ') ||
        errorResult.data.error ||
        'Unknown validation error'
      return { ok: false, errorMessage }
    }

    throw new RuntimeError(`Unexpected response from Slack manifest validate API: ${JSON.stringify(data)}`)
  }

  public async createApp(manifest: object): Promise<ManifestCreateResponse> {
    const { data } = await this._slackApiClient.apiCall('apps.manifest.create', {
      token: this._appConfigToken,
      manifest: JSON.stringify(manifest),
    })

    const successResult = manifestCreateResponseSchema.safeParse(data)
    if (successResult.success) {
      return successResult.data
    }

    const errorResult = manifestErrorResponseSchema.safeParse(data)
    if (errorResult.success) {
      const errorDetails =
        errorResult.data.errors?.map((e) => e.message).join(', ') || errorResult.data.error || 'Unknown error'
      throw new RuntimeError(`Failed to create Slack app: ${errorDetails}`)
    }

    throw new RuntimeError(`Unexpected response from Slack manifest create API: ${JSON.stringify(data)}`)
  }

  public async updateApp(appId: string, manifest: object): Promise<void> {
    const { data } = await this._slackApiClient.apiCall('apps.manifest.update', {
      token: this._appConfigToken,
      app_id: appId,
      manifest: JSON.stringify(manifest),
    })

    const successResult = manifestUpdateSuccessSchema.safeParse(data)
    if (successResult.success) {
      return
    }

    const errorResult = manifestErrorResponseSchema.safeParse(data)
    if (errorResult.success) {
      const errorDetails =
        errorResult.data.errors?.map((e) => e.message).join(', ') || errorResult.data.error || 'Unknown error'
      throw new RuntimeError(`Failed to update Slack app manifest: ${errorDetails}`)
    }

    throw new RuntimeError(`Unexpected response from Slack manifest update API: ${JSON.stringify(data)}`)
  }
}

export const buildSlackAppManifest = (webhookUrl: string, redirectUri: string, appName: string) => ({
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
