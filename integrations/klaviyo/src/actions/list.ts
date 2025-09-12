import { RuntimeError } from '@botpress/sdk'
import { ListMembersAddQuery, ProfileEnum } from 'klaviyo-api'
import * as bp from '.botpress'
import { getListsApi } from '../auth'

export const addProfileToList: bp.IntegrationProps['actions']['addProfileToList'] = async ({ ctx, logger, input }) => {
  const { listId, profileIds } = input

  try {
    const listsApi = getListsApi(ctx)

    const listMembersAddQuery: ListMembersAddQuery = {
      data: profileIds.map((profileId) => ({
        type: ProfileEnum.Profile,
        id: profileId,
      })),
    }

    await listsApi.addProfilesToList(listId, listMembersAddQuery)

    return {
      success: true,
    }
  } catch (error: any) {
    logger.forBot().error('Failed to add profiles to Klaviyo list', error)

    if (error.response?.data?.errors) {
      const errorMessages = error.response.data.errors.map((err: any) => err.detail).join(', ')
      throw new RuntimeError(`Klaviyo API error: ${errorMessages}`)
    }

    throw new RuntimeError('Failed to add profiles to list in Klaviyo')
  }
}
