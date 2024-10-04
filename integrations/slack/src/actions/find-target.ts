import Fuse from 'fuse.js'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'
import { Target } from '../definitions/actions'

const fuse = new Fuse<Target>([], {
  shouldSort: true,
  threshold: 0.3,
  minMatchCharLength: 2,
  isCaseSensitive: false,
  includeMatches: true,
  findAllMatches: true,
  useExtendedSearch: true,
  ignoreLocation: true,
  keys: ['displayName'],
})

export const findTarget = wrapActionAndInjectSlackClient('findTarget', {
  async action({ slackClient }, { channel, query }) {
    const targets: Target[] = []

    const queryUsers = async (cursor?: string) => {
      const list = await slackClient.users.list({ cursor, limit: 200 })
      const users = (list.members || [])
        .filter((x) => !x.deleted)
        .map<Target>((member) => ({
          displayName: member.name!,
          name: member.profile?.real_name ?? '',
          email: member.profile?.email ?? '',
          tags: { id: member.id! },
          channel: 'dm',
        }))

      fuse.setCollection(users)
      targets.push(...fuse.search<Target>(query).map((x) => x.item))

      if (list.response_metadata?.next_cursor) {
        await queryUsers(list.response_metadata.next_cursor)
      }
    }

    const queryChannels = async (types: string, cursor?: string) => {
      const list = await slackClient.conversations.list({ exclude_archived: true, cursor, limit: 200, types })

      const channels =
        (list.channels || []).map<Target>((channel) => ({
          displayName: channel.name!,
          tags: { id: channel.id! },
          channel: 'channel',
        })) || []

      fuse.setCollection(channels)
      targets.push(...fuse.search<Target>(query).map((x) => x.item))

      if (list.response_metadata?.next_cursor) {
        await queryChannels(types, list.response_metadata.next_cursor)
      }
    }

    if (channel === 'dm') {
      await queryUsers()
    } else if (!channel || channel === 'channel') {
      await queryChannels('public_channel')
    }

    return {
      targets,
    }
  },
  errorMessage: 'Failed to find any target',
})
