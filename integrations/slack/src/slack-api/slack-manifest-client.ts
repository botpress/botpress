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
export type SlackAppManifest = z.infer<typeof manifestSchema>

export class SlackManifestClient {
  private readonly _client: bp.Client
  private readonly _ctx: bp.Context
  private readonly _logger: bp.Logger
  private readonly _appConfigurationToken: string
  private readonly _slackApiClient: SlackApiClient

  public constructor({
    client,
    ctx,
    logger,
    appConfigurationToken,
  }: bp.CommonHandlerProps & { appConfigurationToken: string }) {
    this._client = client
    this._ctx = ctx
    this._logger = logger
    this._appConfigurationToken = appConfigurationToken
    this._slackApiClient = new SlackApiClient(appConfigurationToken)
  }

  public async validateManifest(
    manifest: SlackAppManifest
  ): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
    if (manifest === null || manifest === undefined) {
      throw new RuntimeError('Error in manifest validation: Manifest cannot be null or undefined')
    }
    this._logger.forBot().debug(this._slackApiClient.apps)
    const { data } = await this._slackApiClient.apiCall('apps.manifest.validate', {
      token: this._appConfigurationToken,
      manifest: JSON.stringify(manifest),
    })
    this._logger.forBot().debug('Received response from Slack manifest validation API', { response: data })

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

  public async createApp(manifest: SlackAppManifest): Promise<ManifestCreateResponse> {
    const { data } = await this._slackApiClient.apiCall('apps.manifest.create', {
      token: this._appConfigurationToken,
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

  public async updateApp(appId: string, manifest: SlackAppManifest): Promise<void> {
    const { data } = await this._slackApiClient.apiCall('apps.manifest.update', {
      token: this._appConfigurationToken,
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
