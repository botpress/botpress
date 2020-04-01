import _ from 'lodash'

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
    argsStr = actionInstruction.replace(serverAndAction + ' ', '')
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
