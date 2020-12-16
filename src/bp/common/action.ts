import { IO } from 'botpress/sdk'
import _ from 'lodash'

import { EventCommonArgs, OutgoingEventCommonArgs } from './typings'

export interface ActionInstruction {
  actionName: string
  argsStr: string
  actionServerId?: string
}

export const parseActionInstruction = (actionInstruction: string): ActionInstruction => {
  const chunks = actionInstruction.split(' ')
  const serverAndAction = _.head(chunks)!
  let argsStr = ''
  if (chunks.length > 1) {
    argsStr = actionInstruction.replace(`${serverAndAction} `, '')
  }
  const serverAndActionChunks = serverAndAction.split(':')
  let actionName
  let actionServerId

  if (serverAndActionChunks.length === 1) {
    actionName = serverAndActionChunks[0]
  } else {
    actionServerId = serverAndActionChunks[0]
    actionName = serverAndActionChunks[1]
  }

  return {
    actionName,
    argsStr,
    actionServerId
  }
}

export const extractEventCommonArgs = (
  event: IO.Event | IO.IncomingEvent,
  args?: { [property: string]: any }
): EventCommonArgs | OutgoingEventCommonArgs => {
  if (event.direction === 'outgoing') {
    return {
      ...(args ?? {}),
      event
    }
  }
  const incomingEvent = event as IO.IncomingEvent

  return {
    ...(args ?? {}),
    event: incomingEvent,
    user: incomingEvent.state.user ?? {},
    session: incomingEvent.state.session ?? ({} as IO.CurrentSession),
    temp: incomingEvent.state.temp ?? {},
    bot: incomingEvent.state.bot ?? {},
    workflow: incomingEvent.state.workflow ?? ({} as IO.WorkflowHistory)
  }
}
