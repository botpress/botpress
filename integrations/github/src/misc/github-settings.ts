import * as sdk from '@botpress/client'

import * as types from './types'
import * as bp from '.botpress'

export namespace GithubSettings {
  export function getWebhookSecret({ ctx }: { ctx: types.Context }) {
    return ctx.configurationType === null ? bp.secrets.GITHUB_WEBHOOK_SECRET : ctx.configuration.githubWebhookSecret
  }

  export async function getOrganizationHandle({ ctx, client }: { ctx: types.Context; client: types.Client }) {
    const { state } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })

    if (!state.payload.organizationHandle) {
      throw new sdk.RuntimeError('Organization handle not found. Please complete the authorization flow and try again.')
    }

    return state.payload.organizationHandle
  }

  export function getAppSettings({ ctx, client }: { ctx: types.Context; client: types.Client }) {
    const appId = _getAppId({ ctx })
    const privateKey = _getAppPrivateKey({ ctx })
    const installationId = _getAppInstallationId({ ctx, client })

    return {
      appId,
      privateKey,
      installationId,
    }
  }

  function _getAppId({ ctx }: { ctx: types.Context }) {
    return ctx.configurationType === 'manualApp' ? ctx.configuration.githubAppId : bp.secrets.GITHUB_APP_ID
  }
  function _getAppPrivateKey({ ctx }: { ctx: types.Context }) {
    return _fixRSAPrivateKey(
      ctx.configurationType === 'manualApp' ? ctx.configuration.githubAppPrivateKey : bp.secrets.GITHUB_PRIVATE_KEY
    )
  }

  async function _getAppInstallationId({ ctx, client }: { ctx: types.Context; client: types.Client }) {
    if (ctx.configurationType === 'manualApp') {
      return ctx.configuration.githubAppInstallationId
    }

    const { state } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })

    if (!state.payload.githubInstallationId) {
      throw new sdk.RuntimeError(
        'GitHub installation ID not found. Please complete the authorization flow and try again.'
      )
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
 * Multi-line secrets are also broken in the GitHub Actions deployment
 * pipelines, because they are being pasted verbatim into a bash script, thus
 * breaking the script because each line is interpreted as a separate command.
 * This means this function is also useful for fixing the private key in the
 * GitHub repository secrets.
 *
 * FIXME: Remove this workaround once ZUI gets support for multi-line inputs and
 * our GitHub Actions pipelines get support for multi-line secrets.
 */
const _fixRSAPrivateKey = (key: string) => {
  const parts = key.trim().split('-----')

  const header = parts[1]?.trim()
  const body = parts[2]?.trim()?.replace(/\s+/g, '\n')
  const footer = parts[3]?.trim()

  return `-----${header}-----\n${body}\n-----${footer}-----`
}
