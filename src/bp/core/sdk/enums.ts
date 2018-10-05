import { IO } from 'botpress/sdk'

export enum LoggerLevel {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Debug = 'debug'
}

export enum NodeActionType {
  RenderElement = 'render',
  RunAction = 'run',
  RenderText = 'say'
}

export const WellKnownFlags: typeof IO.WellKnownFlags = {
  SKIP_DIALOG_ENGINE: Symbol.for('skipDialogEngine')
}
