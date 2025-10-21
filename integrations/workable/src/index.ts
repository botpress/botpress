import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'
import { WorkableClient } from './workable-api/client'
import {
  fromListCandidatesInputModel,
  toGetCandidateModel,
  toListCandidatesOutputModel,
} from './mapping/candidate-mapper'

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
      const raw = await client.listCandidates(fromListCandidatesInputModel(props.input))
      return toListCandidatesOutputModel(raw)
    },
    getCandidate: async (props) => {
      const client = new WorkableClient(props.ctx.configuration.apiToken, props.ctx.configuration.subDomain)
      const raw = await client.getCandidate(props.input)
      return toGetCandidateModel(raw)
    },
  },
  channels: {},
  handler: async () => {},
})
