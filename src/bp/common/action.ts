import { IO } from 'botpress/sdk'
import _ from 'lodash'

import { EventCommonArgs } from './typings'

export interface ActionInstruction {
  actionName: string
  argsStr: string
  actionServerId?: string
}

export const parseActionInstruction = (actionInstruction: string): ActionInstruction => {
  const chunks = actionInstruction.split(' ')
  const serverAndAction = chunks[0]
  const actionChunks = serverAndAction.split(':')

  return {
    actionName: actionChunks.length === 1 ? actionChunks[0] : actionChunks.splice(1).join(':'),
    argsStr: chunks.slice(1).join(' '),
    actionServerId: actionChunks.length === 1 ? undefined : actionChunks[0]
  }
}

export const extractEventCommonArgs = (
  event: IO.IncomingEvent,
  args?: { [property: string]: any }
): EventCommonArgs => {
  return {
    ...(args ?? {}),
    event,
    user: event.state.user ?? {},
    session: event.state.session ?? ({} as IO.CurrentSession),
    temp: event.state.temp ?? {},
    bot: event.state.bot ?? {},
    workflow: event.state.workflow ?? ({} as IO.WorkflowHistory)
  }
}
