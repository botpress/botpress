import { RuntimeError, isApiError } from '@botpress/sdk'
import { MondayClient } from 'src/misc/monday-client'
import * as bp from '.botpress'

type CreateItem = bp.IntegrationProps['actions']['createItem']

export const createItem: CreateItem = async ({ input, ctx, client }) => {
  const accessToken = (await _getOAuthAccessToken({ client, ctx })) ?? ctx.configuration.personalAccessToken

  if (!accessToken) {
    throw new RuntimeError('Monday credentials are missing. Please connect your Monday account or provide a personal access token.')
  }

  const mondayClient = MondayClient.create({
    personalAccessToken: accessToken,
  })

  await mondayClient.createItem(input.boardId, {
    name: input.itemName,
  })

  return {}
}

const _getOAuthAccessToken = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  const { state } = await client
    .getState({
      type: 'integration',
      name: 'oAuthCredentials',
      id: ctx.integrationId,
    })
    .catch((thrown: unknown) => {
      if (isApiError(thrown) && thrown.code === 404) {
        return { state: undefined }
      }

      throw thrown
    })

  return state?.payload.accessToken
}
