import { HubSpotHitlClient, ThreadInfo } from '../client'
import * as bp from '.botpress'

interface HubSpotEvent {
  objectId: string | number
  subscriptionType: string
  propertyName?: string
  propertyValue?: string
}

interface OperatorAssignedParams {
  hubspotEvent: HubSpotEvent
  client: bp.Client
  hubSpotClient: HubSpotHitlClient
  logger: bp.Logger
}

export const handleOperatorAssignedUpdate = async ({
  hubspotEvent,
  client,
  hubSpotClient,
  logger,
}: OperatorAssignedParams) => {
  const threadInfo: ThreadInfo = await hubSpotClient.getThreadInfo(String(hubspotEvent.objectId))
  const contactId = threadInfo.associatedContactId

  const email = await hubSpotClient.getActorEmail('V-' + contactId).catch(() => '')
  const phoneNumber = await hubSpotClient.getActorPhoneNumber(contactId).catch(() => '')

  if (!email && !phoneNumber) {
    logger.forBot().error(`No email or phone number found for contact: ${contactId}`)
    return
  }

  let user: bp.ClientOutputs['getOrCreateUser']['user'] | undefined
  let emailUserToDelete: bp.ClientOutputs['getOrCreateUser']['user'] | null = null
  let phoneUserToDelete: bp.ClientOutputs['getOrCreateUser']['user'] | null = null

  if (email) {
    const { user: emailUser } = await client.getOrCreateUser({ tags: { email } })
    if (emailUser.tags?.contactType) {
      user = emailUser
    } else {
      emailUserToDelete = emailUser
      if (phoneNumber) {
        const { user: phoneUser } = await client.getOrCreateUser({ tags: { phoneNumber } })
        if (phoneUser.tags?.contactType) {
          user = phoneUser
        } else {
          phoneUserToDelete = phoneUser
        }
      }
    }
  } else if (phoneNumber) {
    const { user: phoneUser } = await client.getOrCreateUser({ tags: { phoneNumber } })
    if (phoneUser.tags?.contactType) {
      user = phoneUser
    } else {
      phoneUserToDelete = phoneUser
    }
  }

  if (emailUserToDelete) {
    await client.deleteUser({ id: emailUserToDelete.id }).catch((err) => {
      logger.forBot().warn(`Failed to delete spurious email user ${emailUserToDelete!.id}:`, err)
    })
  }
  if (phoneUserToDelete) {
    await client.deleteUser({ id: phoneUserToDelete.id }).catch((err) => {
      logger.forBot().warn(`Failed to delete spurious phone user ${phoneUserToDelete!.id}:`, err)
    })
  }

  if (!user) {
    logger.forBot().error(`No existing user found for contact ${contactId} — cannot fire hitlAssigned`)
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: { id: threadInfo.id },
  })

  await client.createEvent({
    type: 'hitlAssigned',
    payload: {
      conversationId: conversation.id,
      userId: user.id,
    },
  })

  logger.forBot().info(`hitlAssigned fired: conversation=${conversation.id}, user=${user.id}`)
}
