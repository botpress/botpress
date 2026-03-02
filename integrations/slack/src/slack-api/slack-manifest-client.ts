import { z, RuntimeError } from '@botpress/sdk'
import * as SlackWebClient from '@slack/web-api'
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
    verification_token: z.string(),
  }),
  oauth_authorize_url: z.string(),
})

export type ManifestCreateResponse = z.infer<typeof manifestCreateResponseSchema>
export type SlackAppManifest = z.infer<typeof manifestSchema>

type ManifestAppCredentialsState = bp.states.manifestAppCredentials.ManifestAppCredentials['payload']
export const patchAppManifestConfigurationState = async (
  client: bp.Client,
  ctx: bp.Context,
  newState: Partial<ManifestAppCredentialsState>
) => {
  const currentState = await getAppManifestConfigurationState(client, ctx)
  const { data, success } = z.custom<ManifestAppCredentialsState>().safeParse({
    ...currentState,
    ...newState,
  })
  if (!success) {
    throw new RuntimeError(`Failed to parse manifest app credentials state: ${JSON.stringify(data)}`)
  }
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
  } catch (error) {
    throw new RuntimeError(
      `Failed to get manifest app credentials state: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export class SlackManifestClient {
  private readonly _logger: bp.Logger
  private readonly _appConfigurationToken: string
  private readonly _slackWebClient: SlackWebClient.WebClient

  private constructor({ ctx, logger }: bp.CommonHandlerProps) {
    if (
      ctx.configurationType !== 'manifestAppCredentials' ||
      !ctx.configuration.appConfigurationToken ||
      !ctx.configuration.appConfigurationRefreshToken
    ) {
      throw new RuntimeError('Slack manifest app credentials are not properly configured')
    }
    this._logger = logger
    this._appConfigurationToken = ctx.configuration.appConfigurationToken
    this._slackWebClient = new SlackWebClient.WebClient(this._appConfigurationToken)
  }

  public static async create(props: bp.CommonHandlerProps) {
    await SlackManifestClient._validateAppConfigurationToken(props)
    return new SlackManifestClient(props)
  }

  private static async _validateAppConfigurationToken({ client, ctx, logger }: bp.CommonHandlerProps) {
    if (
      ctx.configurationType !== 'manifestAppCredentials' ||
      !ctx.configuration.appConfigurationToken ||
      !ctx.configuration.appConfigurationRefreshToken
    ) {
      throw new RuntimeError('Slack manifest app credentials are not properly configured')
    }

    const slackWebClient = new SlackWebClient.WebClient()
    logger.forBot().debug('Validating Slack app configuration token and refresh token...')
    const { ok, error } = await slackWebClient.auth
      .test({
        token: ctx.configuration.appConfigurationToken,
      })
      .catch((e) => e.data as SlackWebClient.AuthTestResponse)

    if (!ok && error === 'token_expired') {
      logger
        .forBot()
        .debug('Slack app configuration token has expired, attempting to rotate the token using the refresh token...')
      const { token: rotatedToken, refresh_token } = surfaceSlackErrors({
        logger,
        response: await slackWebClient.tooling.tokens.rotate({
          refresh_token: ctx.configuration.appConfigurationRefreshToken,
        }),
      })
      logger
        .forBot()
        .debug('Rotating Slack app configuration token...', ctx.configuration.appConfigurationToken, rotatedToken)
      await patchAppManifestConfigurationState(client, ctx, {
        appConfigurationToken: rotatedToken,
        appConfigurationRefreshToken: refresh_token,
      })
      logger
        .forBot()
        .debug('Rotated expired Slack app configuration token successfully', ctx.configuration.appConfigurationToken)
    } else if (!ok) {
      throw new RuntimeError(`Failed to validate Slack app configuration token: ${error}`)
    }
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
