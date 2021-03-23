import { IO } from 'botpress/sdk'

export enum NodeActionType {
  RenderElement = 'render',
  RunAction = 'run',
  RenderText = 'say'
}

export const WellKnownFlags: typeof IO.WellKnownFlags = {
  SKIP_DIALOG_ENGINE: Symbol.for('skipDialogEngine'),
  SKIP_QNA_PROCESSING: Symbol.for('avoidQnaProcessing'),
  SKIP_NATIVE_NLU: Symbol.for('skipNativeNLU'),
  FORCE_PERSIST_STATE: Symbol.for('forcePersistState')
}
