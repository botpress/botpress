import axios, { AxiosInstance } from 'axios'

const coreClient: AxiosInstance = axios.create({
  headers: { authorization: process.env.INTERNAL_PASSWORD },
  baseURL: `http://localhost:${process.core_env.CORE_PORT}/api/internal`
})

export const coreActions = {
  invalidateFile: async (key: string) => {
    await coreClient.post('/invalidateFile', { key })
  },
  onModuleEvent: async (eventType: string, payload: any) => {
    await coreClient.post('/onModuleEvent', { eventType, ...payload })
  },
  notifyFlowChanges: async payload => {
    await coreClient.post('/notifyFlowChange', payload)
  },
  invalidateCmsForBot: async (botId: string) => {
    await coreClient.post('/invalidateCmsForBot', { botId })
  }
}
