import { CommonEventData } from 'definitions/events'
import { TrelloEventAction } from '../schemas/common'

export const extractIdAndName = (obj: { id: string; name: string }) => {
  return {
    id: obj.id,
    name: obj.name,
  }
}

export const extractIdAndNameIfExists = (obj: { id: string; name: string } | undefined) => {
  return obj ? extractIdAndName(obj) : undefined
}

const _extractActorData = (actionData: TrelloEventAction): CommonEventData['actor'] => {
  if (actionData.appCreator !== null) {
    return {
      id: actionData.appCreator.id,
      type: 'app' as const,
    }
  } else {
    return {
      id: actionData.memberCreator.id,
      type: 'member' as const,
      name: actionData.memberCreator.fullName,
    }
  }
}

export const extractCommonEventData = (actionData: TrelloEventAction): CommonEventData => {
  return {
    eventId: actionData.id,
    actor: _extractActorData(actionData),
    dateCreated: actionData.date.toISOString(),
  }
}
