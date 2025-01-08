import * as errors from './gen/errors'
import * as types from './types'
import * as bp from '.botpress'

export type ApiUtils = {
  findParticipant: (req: types.ClientRequests['getParticipant']) => Promise<{
    participant?: types.ClientResponses['getParticipant']['participant']
  }>
  findUser: (req: types.ClientRequests['getUser']) => Promise<{
    user?: types.ClientResponses['getUser']['user']
  }>
}

export const makeApiUtils = (client: bp.Client): ApiUtils => ({
  findParticipant: async (req) =>
    client.getParticipant(req).catch((thrown) => {
      if (errors.isApiError(thrown) && (thrown.type === 'ResourceNotFound' || thrown.type === 'ReferenceNotFound')) {
        return { participant: undefined }
      }
      throw thrown
    }),
  findUser: async (req) =>
    client.getUser(req).catch((thrown) => {
      if (errors.isApiError(thrown) && thrown.type === 'ResourceNotFound') {
        return { user: undefined }
      }
      throw thrown
    }),
})
