import uuid from 'uuid'

export type ServerStats = {
  externalUrl: string
  botpressVersion: string
  fingerprint: string | null
  clusterEnabled: boolean
  machineUUID: string
  os: string
  totalMemoryBytes: number
  uptime: number
  bpfsStorage: string
  dbType: string
}

export type Schema = {
  timestamp: Date
  uuid: string
  schema: string
  source: string
  server: ServerStats
}

export const getSchema = (server: ServerStats, source: string) => {
  return {
    timestamp: new Date(),
    uuid: uuid.v4(),
    schema: '1.0.0',
    source,
    server
  }
}
