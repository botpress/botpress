export interface StudioConnector {
  /** Event emitter */
  events: any
  /** An axios instance */
  axios: any
  toast: any
  getModuleInjector: any
  loadModuleView: any
}

export interface FileFilters {
  filename?: string
}
