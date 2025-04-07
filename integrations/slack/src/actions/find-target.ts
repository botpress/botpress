import Fuse from 'fuse.js'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'
import { Target } from '../../definitions/actions'

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

export const findTarget = wrapActionAndInjectSlackClient(
  { actionName: 'findTarget', errorMessage: 'Failed to find any target' },
  async ({ slackClient }, { channel, query }) => {
    const targets: (Target & Record<string, unknown>)[] =
      channel === 'dm'
        ? await slackClient
            .enumerateAllMembers()
            .collect()
            .then((members) =>
              members.map((member) => ({
                // TODO: perform mapping in the slack client directly; we don't want
                //       to expose raw slack member objects outside of the custom
                //       slack client
                displayName: member.name!,
                name: member.profile?.real_name ?? '',
                email: member.profile?.email ?? '',
                tags: { id: member.id! },
                channel: 'dm',
              }))
            )
        : await slackClient
            .enumerateAllPublicChannels()
            .collect()
            .then((channels) =>
              channels.map((channel) => ({
                displayName: channel.name!,
                tags: { id: channel.id! },
                channel: 'channel',
              }))
            )

    fuse.setCollection(targets)
    const filteredTargets: Target[] = fuse.search<Target>(query).map((x) => x.item)

    return {
      targets: filteredTargets,
    }
  }
)
