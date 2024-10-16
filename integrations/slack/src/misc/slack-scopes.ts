import { RuntimeError } from '@botpress/client'
import { WebClient } from '@slack/web-api'
import { getAccessToken } from './utils'
import { Client, Context } from '.botpress'

export namespace SlackScopes {
  export const ensureHasAllScopes = async ({
    client,
    ctx,
    requiredScopes,
    operation,
  }: {
    requiredScopes: string[]
    client: Client
    ctx: Context
    operation: string
  }) => {
    const grantedScopes = await _getOrRefreshScopes({ client, ctx })

    const hasAllScopes = requiredScopes
      .map(_normalizeScopeName)
      .every((requiredScope) => grantedScopes.includes(requiredScope))

    if (!hasAllScopes) {
      throw new RuntimeError(
        `The Slack access token is missing required scopes to perform operation "${operation}". ` +
          'Please re-authorize the app. \n' +
          `Required scopes: ${requiredScopes.join(', ')}. \nGranted scopes: ${grantedScopes.join(', ')}`
      )
    }
  }

  export const saveScopes = async ({ client, ctx, scopes }: { scopes: string[]; client: Client; ctx: Context }) => {
    await client.setState({
      id: ctx.integrationId,
      type: 'integration',
      name: 'tokenMetadata',
      payload: {
        scopes: scopes.map(_normalizeScopeName),
        lastRefresh: new Date().toISOString(),
      },
    })
  }

  const _normalizeScopeName = (scope: string) => {
    return scope.trim().toLowerCase()
  }

  const _getOrRefreshScopes = async ({ client, ctx }: { client: Client; ctx: Context }) => {
    let scopes = await _getScopesFromCache({ client, ctx })

    if (!scopes.length) {
      scopes = await _getScopesFromSlack({ client, ctx })
      await saveScopes({ client, ctx, scopes })
    }

    return scopes
  }

  const _getScopesFromCache = async ({ client, ctx }: { client: Client; ctx: Context }) => {
    const { state } = await client.getState({ type: 'integration', name: 'tokenMetadata', id: ctx.integrationId })
    const lastRefresh = new Date(state.payload.lastRefresh)

    return _isCacheExpired(lastRefresh) ? [] : state.payload.scopes
  }

  const _isCacheExpired = (lastRefresh: Date) => {
    const millisecondsInSixHours = 1000 * 60 * 60 * 6
    const sixHoursAgo = new Date(Date.now() - millisecondsInSixHours)

    return lastRefresh < sixHoursAgo
  }

  const _getScopesFromSlack = async ({ client, ctx }: { client: Client; ctx: Context }) => {
    const slackClient = new WebClient(await getAccessToken(client, ctx))

    const identity = await slackClient.auth.test()
    const grantedScopes = identity.response_metadata?.scopes ?? []

    return grantedScopes
  }
}
