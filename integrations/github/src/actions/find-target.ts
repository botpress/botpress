import Fuse from 'fuse.js'
import { Octokit } from 'octokit'

import { Target } from '../definitions/actions'
import { Implementation } from '../misc/types'

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

export const findTarget: Implementation['actions']['findTarget'] = async ({ input, ctx }) => {
  const { owner, repo, token } = ctx.configuration
  const client = new Octokit({ auth: token })

  const targets: Target[] = []

  // const queryUsers = async (cursor?: string) => {
  //   const list = await client.rest.repos.listContributors({ owner, repo })

  //   const users = (list.data || []).map<Target>((user) => ({
  //     displayName: user.name || user.login || '',
  //     tags: addTags({ id: user.id?.toString() }),
  //     channel: 'pullRequest',
  //   }))

  //   fuse.setCollection(users)
  //   targets.push(...fuse.search<Target>(input.query).map((x) => x.item))
  // }

  const queryPullRequests = async () => {
    const pullRequests = await client.rest.pulls.list({ owner, repo, per_page: 200, state: 'open' })

    const items = (pullRequests.data || []).map<Target>((item) => ({
      displayName: `${item.number} - ${item.title}`,
      tags: { id: item.number?.toString() },
      channel: 'pullRequest',
    }))

    fuse.setCollection(items)
    targets.push(...fuse.search<Target>(input.query).map((x) => x.item))
  }

  if (input.channel === 'pullRequest') {
    await queryPullRequests()
  }
  // await queryUsers()

  return {
    targets,
  }
}
