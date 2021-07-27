import * as sdk from 'botpress/sdk'

export const StepScopes = {
  Received: 'received',
  StateLoaded: 'stateLoaded',
  Middleware: 'mw',
  Dialog: 'dialog',
  Action: 'action',
  Hook: 'hook',
  EndProcessing: 'completed'
}

export const StepStatus = {
  Started: 'start',
  Completed: 'completed',
  Error: 'error',
  TimedOut: 'timedOut',
  Swallowed: 'swallowed',
  Skipped: 'skipped'
}

export const addStepToEvent = (event: sdk.IO.Event, scope: string, name?: string, status?: string) => {
  if (!event?.debugger) {
    return
  }

  event.processing = {
    ...(event.processing || {}),
    [`${scope}${name ? `:${name}` : ''}${status ? `:${status}` : ''}`]: {
      ...(event?.activeProcessing || {}),
      date: new Date()
    }
  }

  event.activeProcessing = {}
}
