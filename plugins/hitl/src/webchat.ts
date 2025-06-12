import * as bp from '.botpress'

type WebchatGetOrCreateUserInput = {
  name?: string
  pictureUrl?: string
  email?: string
  user: {
    id: string
    conversationId: string
  }
}

/**
 * This functions tries to create a copy of the downstream user in the upstream system.
 * The goal is for the patient to have the illusion that they receive messages from a human agent instead of the bot.
 *
 * This only works when the hitl frontend is webchat.
 * Currently, this dependency of hitl plugin on webchat integration is not declared.
 * If it fails, the plugin still works, but patients will see messages as sent by the bot.
 *
 * This workaround is extremely flaky. If we need this feature in another integration, we should do it properly.
 *
 * @param props hook handler props
 * @param upstreamConversationId the upstream conversation id
 * @returns the fake upstream user id that the bot pretends to be when sending messages
 */
export const tryLinkWebchatUser = async (
  props: bp.HookHandlerProps['before_incoming_message'],
  upstreamConversationId: string,
  isUsingWebchatAsHitlFrontend: boolean
): Promise<string | undefined> => {
  if (!isUsingWebchatAsHitlFrontend) {
    // this only works when the hitl frontend is webchat
    return undefined
  }

  const {
    data: { userId: downstreamUserId },
  } = props

  try {
    const { user: downstreamUser } = await props.client.getUser({ id: downstreamUserId })
    const upstreamUserId = downstreamUser.tags['upstream']
    if (upstreamUserId) {
      // the user is already linked
      return upstreamUserId
    }

    const { output } = await props.client.callAction({
      type: 'webchat:getOrCreateUser',
      input: {
        name: downstreamUser.name,
        pictureUrl: downstreamUser.pictureUrl,
        email: downstreamUser.tags['email'],
        user: {
          id: downstreamUserId,
          conversationId: upstreamConversationId,
        },
      } as WebchatGetOrCreateUserInput,
    })

    const { userId } = output as Record<string, unknown>
    if (typeof userId !== 'string') {
      return undefined
    }

    await props.client.updateUser({
      id: downstreamUserId,
      tags: {
        upstream: userId,
      },
    })

    return userId
  } catch {
    return undefined
  }
}
