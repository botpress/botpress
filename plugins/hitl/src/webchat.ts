import * as configuration from './configuration'
import type * as types from './types'
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

export type TryLinkWebchatUserOptions = {
  downstreamUser: types.ActionableUser
  upstreamConversation: types.ActionableConversation
  forceLink?: boolean
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
  props: bp.HookHandlerProps['before_incoming_message'] | bp.HookHandlerProps['before_incoming_event'],
  { forceLink, downstreamUser, upstreamConversation }: TryLinkWebchatUserOptions
): Promise<string | undefined> => {
  const sessionConfig = await configuration.retrieveSessionConfig({
    ...props,
    upstreamConversationId: upstreamConversation.id,
  })

  const { integration: upstreamIntegration } = upstreamConversation

  if (upstreamIntegration !== 'webchat' || !sessionConfig.useHumanAgentInfo) {
    // this only works when the hitl frontend is webchat
    return undefined
  }

  try {
    props.logger.info(
      `Trying to link downstream user ${downstreamUser.id} to upstream conversation ${upstreamConversation.id}`
    )

    const upstreamUserId = downstreamUser.tags['upstream']
    if (upstreamUserId && !forceLink) {
      // the user is already linked
      return upstreamUserId
    }

    // To access bot-level tags:
    const untypedDownstreamUserTags: Record<string, string> = downstreamUser.tags

    const { output } = await props.client.callAction({
      type: 'webchat:getOrCreateUser',
      input: {
        name: downstreamUser.name,
        pictureUrl: downstreamUser.pictureUrl,
        email: untypedDownstreamUserTags['email'],
        user: {
          id: downstreamUser.id,
          conversationId: upstreamConversation.id,
        },
      } as WebchatGetOrCreateUserInput,
    })

    const { userId } = output as Record<string, unknown>
    if (typeof userId !== 'string') {
      return undefined
    }

    await downstreamUser.update({
      tags: {
        upstream: userId,
      },
    })

    return userId
  } catch {
    return undefined
  }
}
