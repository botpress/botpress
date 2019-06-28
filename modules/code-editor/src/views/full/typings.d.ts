export interface StudioConnector {
  /** Event emitter */
  events: any
  /** An axios instance */
  axios: any
  toast: any
  getModuleInjector: any
  loadModuleView: any
}

export type Config = {
  isGlobalAllowed: boolean
  isBotConfigIncluded: boolean
}

export interface FileFilters {
  filename?: string
}
