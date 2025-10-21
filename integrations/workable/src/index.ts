import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'
import { WorkableClient } from './workable-api/client'
import { WorkableService } from './workable-api/service'

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
      const service = new WorkableService(client)
      const result = await service.listCandidates(props.input)
      return result
    },
    // getCandidate: async (props) => {
    //   const client = new WorkableClient(props.ctx.configuration.apiToken, props.ctx.configuration.subDomain)
    //   return await client.getCandidate(props.input)
    // },
  },
  channels: {},
  handler: async () => {},
})
