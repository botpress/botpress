import { z, RuntimeError } from '@botpress/sdk'
import * as SlackWebClient from '@slack/web-api'
import { states } from 'definitions'
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
    token_rotation_enabled: z.boolean(),
  }),
})

const manifestCreateResponseSchema = z.object({
  ok: z.literal(true),
  app_id: z.string(),
  credentials: z.object({
    client_id: z.string(),
    client_secret: z.string(),
    signing_secret: z.string(),
  }),
  oauth_authorize_url: z.string(),
})

export type ManifestCreateResponse = z.infer<typeof manifestCreateResponseSchema>
export type SlackAppManifest = z.infer<typeof manifestSchema>

type ManifestAppCredentialsState = bp.states.manifestAppCredentials.ManifestAppCredentials['payload']
type AppManifestConfigurationCredentials = Pick<
  ManifestAppCredentialsState,
  'appConfigurationToken' | 'appConfigurationRefreshToken'
>

export const patchAppManifestConfigurationState = async (
  client: bp.Client,
  ctx: bp.Context,
  newState: Partial<ManifestAppCredentialsState>
) => {
  const currentState = await getAppManifestConfigurationState(client, ctx)
  const { data, success } = states.manifestAppCredentials.schema.safeParse({
  const parseResult = states.manifestAppCredentials.schema.safeParse({
    ...currentState,
    ...newState,
  })
  if (!parseResult.success) {
    throw new RuntimeError(`Failed to parse manifest app credentials state: ${parseResult.error.message}`)
  }
  const { data } = parseResult
  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'manifestAppCredentials',
    payload: data,
  })
}

export const getAppManifestConfigurationState = async (
  client: bp.Client,
  ctx: bp.Context
): Promise<Partial<ManifestAppCredentialsState>> => {
  try {
    const { state } = await client.getState({
      type: 'integration',
      name: 'manifestAppCredentials',
      id: ctx.integrationId,
    })
    return state.payload
  } catch {
    return {}
  }
}

export class SlackManifestClient {
  private readonly _logger: bp.Logger
  private readonly _appConfigurationToken: string
  private readonly _slackWebClient: SlackWebClient.WebClient

  private constructor(appConfigurationToken: string, logger: bp.Logger) {
    this._logger = logger
    this._appConfigurationToken = appConfigurationToken
    this._slackWebClient = new SlackWebClient.WebClient(this._appConfigurationToken)
  }

  public static async create(props: bp.CommonHandlerProps) {
    const validToken = await SlackManifestClient._resolveAndValidateToken(props)
    return new SlackManifestClient(validToken, props.logger)
  }

  private static async _resolveTokens({
    client,
    ctx,
  }: bp.CommonHandlerProps): Promise<AppManifestConfigurationCredentials> {
    if (ctx.configurationType !== 'manifestAppCredentials') {
      throw new RuntimeError('Slack manifest app credentials are not properly configured')
    }

    const state = await getAppManifestConfigurationState(client, ctx)

    const appConfigurationToken = state.appConfigurationToken
    const appConfigurationRefreshToken = state.appConfigurationRefreshToken

    if (!appConfigurationToken || !appConfigurationRefreshToken) {
      throw new RuntimeError('Slack manifest app credentials are not properly configured')
    }

    return { appConfigurationToken, appConfigurationRefreshToken }
  }

  private static async _resolveAndValidateToken(props: bp.CommonHandlerProps): Promise<string> {
    const { client, ctx, logger } = props
    const { appConfigurationToken, appConfigurationRefreshToken } = await SlackManifestClient._resolveTokens(props)

    const slackWebClient = new SlackWebClient.WebClient()
    logger.forBot().debug('Validating Slack app configuration token and refresh token...')
    const { ok, error } = await slackWebClient.auth
      .test({
        token: appConfigurationToken,
      })
      .catch((e) => e.data as SlackWebClient.AuthTestResponse)

    if (!ok && error === 'token_expired') {
      logger
        .forBot()
        .debug('Slack app configuration token has expired, attempting to rotate the token using the refresh token...')
      const { token: rotatedToken, refresh_token } = surfaceSlackErrors({
        logger,
        response: await slackWebClient.tooling.tokens.rotate({
          refresh_token: appConfigurationRefreshToken!,
        }),
      })
      logger.forBot().debug('Rotating Slack app configuration token...')
      await patchAppManifestConfigurationState(client, ctx, {
        appConfigurationToken: rotatedToken,
        appConfigurationRefreshToken: refresh_token,
      })
      logger.forBot().debug('Rotated expired Slack app configuration token successfully')
      return rotatedToken!
    } else if (!ok) {
      throw new RuntimeError(`Failed to validate Slack app configuration token: ${error}`)
    }

    return appConfigurationToken
  }

  public async validateManifest(manifest: SlackAppManifest) {
    surfaceSlackErrors({
      logger: this._logger,
      response: await this._slackWebClient.apps.manifest.validate({
        token: this._appConfigurationToken,
        manifest: JSON.stringify(manifest),
      }),
    })
  }

  public async createApp(manifest: SlackAppManifest): Promise<ManifestCreateResponse> {
    const response = surfaceSlackErrors<SlackWebClient.AppsManifestCreateResponse>({
      logger: this._logger,
      response: await this._slackWebClient.apps.manifest.create({
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

  public async exportApp(appId: string): Promise<SlackAppManifest> {
    const response = surfaceSlackErrors<SlackWebClient.AppsManifestExportResponse>({
      logger: this._logger,
      response: await this._slackWebClient.apps.manifest.export({
        token: this._appConfigurationToken,
        app_id: appId,
      }),
    })
    const { data, success } = manifestSchema.safeParse(response.manifest)
    if (!success) {
      throw new RuntimeError(`Unexpected response from Slack manifest export API: ${JSON.stringify(response.manifest)}`)
    }
    return data
  }

  public async updateApp(appId: string, manifest: SlackAppManifest): Promise<void> {
    surfaceSlackErrors({
      logger: this._logger,
      response: await this._slackWebClient.apps.manifest.update({
        token: this._appConfigurationToken,
        app_id: appId,
        manifest: JSON.stringify(manifest),
      }),
    })
  }

  public async updateAppIfNeeded(appId: string, desiredManifest: SlackAppManifest): Promise<boolean> {
    const currentManifest = await this.exportApp(appId)
    if (JSON.stringify(currentManifest) === JSON.stringify(desiredManifest)) {
      this._logger.forBot().debug('Slack app manifest is up to date, skipping update')
      return false
    }
    this._logger.forBot().debug('Slack app manifest has changed, updating...')
    await this.updateApp(appId, desiredManifest)
    return true
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
    token_rotation_enabled: true,
  },
})
