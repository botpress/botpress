export interface StudioConnector {
  /** Event emitter */
  events: any
  /** An axios instance */
  axios: any
  getModuleInjector: any
  loadModuleView: any
}

export interface FileFilters {
  filename?: string
}

declare global {
  interface Window {
    EXPERIMENTAL: boolean
  }
}
