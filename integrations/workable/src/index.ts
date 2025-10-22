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
    } catch (thrown) {
      const msg = thrown instanceof Error ? thrown.message : String(thrown)
      throw new RuntimeError(`Failed to register the integration: ${msg}`)
    }
  },
  unregister: async () => {},
  actions: {
    listCandidates: async (props) => {
      const client = new WorkableClient(props.ctx.configuration.apiToken, props.ctx.configuration.subDomain)

      try {
        const raw = await client.listCandidates(fromListCandidatesInputModel(props.input))
        return toListCandidatesOutputModel(raw)
      } catch (thrown: unknown) {
        const msg = thrown instanceof Error ? thrown.message : String(thrown)
        throw new RuntimeError(`Failed to list candidates: ${msg}`)
      }
    },
    getCandidate: async (props) => {
      const client = new WorkableClient(props.ctx.configuration.apiToken, props.ctx.configuration.subDomain)

      try {
        const raw = await client.getCandidate(fromGetCandidateInputModel(props.input))
        return toGetCandidateModel(raw)
      } catch (thrown: unknown) {
        const msg = thrown instanceof Error ? thrown.message : String(thrown)
        throw new RuntimeError(`Failed to get candidate with id ${props.input.id}: ${msg}`)
      }
    },
  },
  channels: {},
  handler: async () => {},
})
