export interface StoreInfoBody {
  storedInfo: string
  loadInfo: Function
}

export interface StoreInfoType {
  [key: string]: StoreInfoBody
}

export interface EventPackageInfoType {
  [key: string]: EventPackageInfoBody
}

export interface EventPackageInfoBody {
  locked: boolean
  timeout: string
  getPackage: Function
}

export interface EventData {
  schema: string
  [key: string]: any
}

export interface TelemetryPackage {
  schema: string
  uuid: string
  timestamp: string
  bp_release: string
  bp_license: string
  event_type: string
  source: string
  event_data: EventData
}
