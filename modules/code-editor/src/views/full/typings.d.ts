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

export const enum KeyPosition {
  DOWN = 'down',
  UP = 'up'
}

export type ActionPositionType = 'down' | 'up'
export type BulkAction = 'copy' | 'cut'

export interface KeyStates {
  action: ActionPositionType
  shift: ActionPositionType
}

declare global {
  interface Window {
    EXPERIMENTAL: boolean
  }
}
