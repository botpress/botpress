import uuid from 'uuid'

export type TelemetryEvent = Schema & {
  event_type: string
  event_data: TelemetryEventData
}

export type TelemetryEventData = { [key: string]: any } & {
  schema: string
}

export interface TelemetryEntry {
  uuid: string
  payload: TelemetryEvent
  available: boolean
  lastChanged: Date
  creationDate: Date
}

export interface ServerStats {
  isProduction: boolean
  externalUrl: string
  botpressVersion: string
  clusterEnabled: boolean
  os: string
  bpfsStorage: string
  dbType: string
  machineUUID: string
  fingerprint: string | null
  license: {
    status: string
    type: string
  }
}

export interface Schema {
  timestamp: Date
  uuid: string
  schema: string
  source: string
  server: ServerStats
}

export const buildSchema = (server: ServerStats, source: string): Schema => {
  return {
    timestamp: new Date(),
    uuid: uuid.v4(),
    schema: '1.0.0',
    source,
    server
  }
}
