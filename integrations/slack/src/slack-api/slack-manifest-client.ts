import * as sdk from '@botpress/sdk'
import axios from 'axios'
import { REQUIRED_SLACK_SCOPES } from '../setup'

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

const slackErrorSchema = sdk.z.object({
  message: sdk.z.string(),
  pointer: sdk.z.string(),
})

const manifestCreateResponseSchema = sdk.z.object({
  ok: sdk.z.literal(true),
  app_id: sdk.z.string(),
  credentials: sdk.z.object({
    client_id: sdk.z.string(),
    client_secret: sdk.z.string(),
    signing_secret: sdk.z.string(),
    verification_token: sdk.z.string(),
  }),
  oauth_authorize_url: sdk.z.string(),
})

const manifestErrorResponseSchema = sdk.z.object({
  ok: sdk.z.literal(false),
  error: sdk.z.string().optional(),
  errors: sdk.z.array(slackErrorSchema).optional(),
})

const manifestValidateSuccessSchema = sdk.z.object({
  ok: sdk.z.literal(true),
})

const manifestUpdateSuccessSchema = sdk.z.object({
  ok: sdk.z.literal(true),
})

export type ManifestCreateResponse = sdk.z.infer<typeof manifestCreateResponseSchema>

export class SlackManifestClient {
  public constructor(private readonly _configToken: string) {}

  public async validateManifest(manifest: object): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
    const { data } = await axios.post(`${SLACK_API_BASE}/apps.manifest.validate`, {
      token: this._configToken,
      manifest: JSON.stringify(manifest),
    })

    const successResult = manifestValidateSuccessSchema.safeParse(data)
    if (successResult.success) {
      return { ok: true }
    }

    const errorResult = manifestErrorResponseSchema.safeParse(data)
    if (errorResult.success) {
      const errorMessage =
        errorResult.data.errors?.map((e) => e.message).join(', ') || errorResult.data.error || 'Unknown validation error'
      return { ok: false, errorMessage }
    }

    throw new sdk.RuntimeError(`Unexpected response from Slack manifest validate API: ${JSON.stringify(data)}`)
  }

  public async createApp(manifest: object): Promise<ManifestCreateResponse> {
    const { data } = await axios.post(`${SLACK_API_BASE}/apps.manifest.create`, {
      token: this._configToken,
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
      throw new sdk.RuntimeError(`Failed to create Slack app: ${errorDetails}`)
    }

    throw new sdk.RuntimeError(`Unexpected response from Slack manifest create API: ${JSON.stringify(data)}`)
  }

  public async updateApp(appId: string, manifest: object): Promise<void> {
    const { data } = await axios.post(`${SLACK_API_BASE}/apps.manifest.update`, {
      token: this._configToken,
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
      throw new sdk.RuntimeError(`Failed to update Slack app manifest: ${errorDetails}`)
    }

    throw new sdk.RuntimeError(`Unexpected response from Slack manifest update API: ${JSON.stringify(data)}`)
  }
}

export const buildSlackAppManifest = (webhookUrl: string, redirectUri: string) => ({
  display_information: {
    name: 'Botpress Bot',
  },
  features: {
    bot_user: {
      display_name: 'Botpress Bot',
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
