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

export declare const ActionPosition: {
  DOWN: 'down'
  UP: 'up'
}

export type ActionPositionType = 'down' | 'up'

export interface KeyStates {
  action: ActionPositionType
}

declare global {
  interface Window {
    EXPERIMENTAL: boolean
  }
}
