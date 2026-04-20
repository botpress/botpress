import { CommonEventData } from 'definitions/events'
import { TrelloWebhook } from '../schemas/common'

export const extractIdAndName = (obj: { id: string; name: string }) => {
  return {
    id: obj.id,
    name: obj.name,
  }
}

export const extractIdAndNameIfExists = (obj: { id: string; name: string } | undefined) => {
  return obj ? extractIdAndName(obj) : undefined
}

const _extractActorData = (webhookEvent: TrelloWebhook): CommonEventData['actor'] => {
  if (webhookEvent.appCreator !== null) {
    return {
      id: webhookEvent.appCreator.id,
      type: 'app' as const,
    }
  } else {
    return {
      id: webhookEvent.memberCreator.id,
      type: 'member' as const,
      name: webhookEvent.memberCreator.fullName,
    }
  }
}

export const extractCommonEventData = (webhookEvent: TrelloWebhook): CommonEventData => {
  return {
    eventId: webhookEvent.id,
    actor: _extractActorData(webhookEvent),
    dateCreated: webhookEvent.date.toISOString(),
  }
}
