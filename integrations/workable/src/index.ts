import { RuntimeError } from '@botpress/sdk'
import {
  fromGetCandidateInputModel,
  fromListCandidatesInputModel,
  toGetCandidateModel,
  toListCandidatesOutputModel,
} from './mapping/candidate-mapper'
import { WorkableClient } from './workable-api/client'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    const client = new WorkableClient(props.ctx.configuration.apiToken, props.ctx.configuration.subDomain)
    try {
      await client.listCandidates()
    } catch {
      throw new RuntimeError('Failed to register the integration.')
    }
  },
  unregister: async () => {},
  actions: {
    listCandidates: async (props) => {
      const client = new WorkableClient(props.ctx.configuration.apiToken, props.ctx.configuration.subDomain)

      try {
        const raw = await client.listCandidates(fromListCandidatesInputModel(props.input))
        return toListCandidatesOutputModel(raw)
      } catch (e: unknown) {
        if (e instanceof Error) {
          throw new RuntimeError(e.message)
        }
        throw new RuntimeError('Unknown error')
      }
    },
    getCandidate: async (props) => {
      const client = new WorkableClient(props.ctx.configuration.apiToken, props.ctx.configuration.subDomain)

      try {
        const raw = await client.getCandidate(fromGetCandidateInputModel(props.input))
        return toGetCandidateModel(raw)
      } catch (e: unknown) {
        if (e instanceof Error) {
          throw new RuntimeError(e.message)
        }
        throw new RuntimeError('Unknown error')
      }
    },
  },
  channels: {},
  handler: async () => {},
})
