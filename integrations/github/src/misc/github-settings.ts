import { RuntimeError } from '@botpress/client'

import * as types from './types'
import { secrets } from '.botpress'

export class GithubSettings {
  private constructor() {}

  public static getWebhookSecret({ ctx }: { ctx: types.Context }) {
    return ctx.configurationType === null ? secrets.GITHUB_WEBHOOK_SECRET : ctx.configuration.githubWebhookSecret
  }

  public static async getOrganizationHandle({ ctx, client }: { ctx: types.Context; client: types.Client }) {
    const { state } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })

    if (!state.payload.organizationHandle) {
      throw new RuntimeError('Organization handle not found. Please complete the authorization flow and try again.')
    }

    return state.payload.organizationHandle
  }

  public static getAppSettings({ ctx, client }: { ctx: types.Context; client: types.Client }) {
    const appId = this._getAppId({ ctx })
    const privateKey = this._getAppPrivateKey({ ctx })
    const installationId = this._getAppInstallationId({ ctx, client })

    return {
      appId,
      privateKey,
      installationId,
    }
  }

  private static _getAppId({ ctx }: { ctx: types.Context }) {
    return ctx.configurationType === 'manualApp' ? ctx.configuration.githubAppId : secrets.GITHUB_APP_ID
  }
  private static _getAppPrivateKey({ ctx }: { ctx: types.Context }) {
    return ctx.configurationType === 'manualApp'
      ? _fixRSAPrivateKey(ctx.configuration.githubAppPrivateKey)
      : secrets.GITHUB_PRIVATE_KEY
  }
  private static async _getAppInstallationId({ ctx, client }: { ctx: types.Context; client: types.Client }) {
    if (ctx.configurationType === 'manualApp') {
      return ctx.configuration.githubAppInstallationId
    }

    const { state } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })

    if (!state.payload.githubInstallationId) {
      throw new RuntimeError('GitHub installation ID not found. Please complete the authorization flow and try again.')
    }

    return state.payload.githubInstallationId
  }
}

/**
 * A private key file is required in order to use GitHub Apps. However, it is
 * currently only possible to paste single-line secrets in the Botpress Studio
 * UI. This means that the RSA private key gets mangled when pasted in the UI.
 * This function fixes the private key by adding newlines where necessary.
 *
 * FIXME: Remove this workaround once ZUI gets support for multi-line inputs.
 */
const _fixRSAPrivateKey = (key: string) => {
  const parts = key.trim().split('-----')

  const header = parts[1]?.trim()
  const body = parts[2]?.trim()?.replace(/\s+/g, '\n')
  const footer = parts[3]?.trim()

  return `-----${header}-----\n${body}\n-----${footer}-----`
}
