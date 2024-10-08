import { User } from '@botpress/client'
import { isApiError } from '@botpress/sdk'
import { Member } from '@slack/web-api/dist/response/UsersListResponse'
import { chain, mapKeys, isEqual } from 'lodash'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'
import { SlackScopes } from 'src/misc/slack-scopes'
import { getSyncState, saveSyncState } from 'src/misc/utils'
import { userTags } from '../definitions/index'
import * as bp from '.botpress'

export const syncMembers = wrapActionAndInjectSlackClient('syncMembers', {
  async action({ logger, ctx, client, slackClient }, {}) {
    let { usersLastSyncTs } = await getSyncState(client, ctx)
    logger.forBot().debug(`Last sync timestamp for Slack users: ${usersLastSyncTs}`)

    const allMembers: Member[] = []
    const getAllMembers = async (cursor?: string) => {
      await SlackScopes.ensureHasAllScopes({
        client,
        ctx,
        requiredScopes: ['users:read'],
        operation: 'users.list',
      })
      const res = await slackClient.users.list({ cursor })
      allMembers.push(...(res.members ?? []))
      if (res.response_metadata?.next_cursor) {
        logger.forBot().debug(`Fetching next page of Slack members... (${allMembers.length}/?)`)
        await getAllMembers(res.response_metadata.next_cursor)
      }
    }

    await getAllMembers()

    const membersToSync = chain(allMembers)
      .sortBy((x) => x.updated, 'asc')
      .filter((x) => !x.deleted)
      .filter((x) => (x.updated ?? 0) > (usersLastSyncTs ?? -1))
      .value()

    logger.forBot().debug(`Found ${membersToSync.length}/${allMembers.length} members to sync in Slack workspace`)

    for (const slackMember of membersToSync) {
      logger
        .forBot()
        .debug('Syncing Slack user to Botpress...', { user: slackMember.name, updated: slackMember.updated })
      try {
        const user = await syncSlackUserToBotpressUser(slackMember, client)
        logger.forBot().debug(`Synced Slack user ${user.name} (${user.id})`)
        usersLastSyncTs = Math.max(usersLastSyncTs ?? 0, slackMember.updated ?? 0)
        await saveSyncState(client, ctx, { usersLastSyncTs })
      } catch (err) {
        logger.forBot().error(`Failed to sync Slack user ${slackMember.name}`, err)
      }
    }

    logger.forBot().debug(`Synced ${membersToSync.length} Slack users to Botpress`)

    return { syncedCount: membersToSync.length }
  },
  errorMessage: 'Failed to sync Slack users',
})

const syncSlackUserToBotpressUser = async (member: Member, botpressClient: bp.Client): Promise<User> => {
  try {
    const { user } = await botpressClient.getOrCreateUser({
      tags: {
        id: member.id,
      },
    })

    const latestTags = mapKeys(user.tags, (_v, k) => k.split(':')[1])
    const updatedTags: Record<keyof typeof userTags, string | undefined> = {
      dm_conversation_id: user.tags.dm_conversation_id,
      id: member.id,
      avatar_hash: member.profile?.avatar_hash,
      display_name: member.profile?.display_name,
      display_name_normalized: member.profile?.display_name_normalized,
      email: member.profile?.email,
      image_24: member.profile?.image_24,
      image_48: member.profile?.image_48,
      image_192: member.profile?.image_192,
      image_512: member.profile?.image_512,
      image_1024: member.profile?.image_1024,
      is_admin: member.is_admin?.toString(),
      is_bot: member.is_bot?.toString(),
      phone: member.profile?.phone,
      real_name: member.profile?.real_name,
      real_name_normalized: member.profile?.real_name_normalized,
      status_emoji: member.profile?.status_emoji,
      status_text: member.profile?.status_text,
      team: member.team_id,
      title: member.profile?.title,
      tz: member.tz,
    }

    if (isEqual(latestTags, updatedTags)) {
      return user
    }

    const { user: updatedUser } = await botpressClient.updateUser({
      id: user.id,
      name: member.name,
      pictureUrl: member.profile?.image_512,
      tags: updatedTags,
    })

    return updatedUser
  } catch (err) {
    if (isApiError(err) && err.type === 'RateLimited') {
      await new Promise((resolve) => setTimeout(resolve, 10 * 1000))
      return syncSlackUserToBotpressUser(member, botpressClient)
    }
    throw err
  }
}
