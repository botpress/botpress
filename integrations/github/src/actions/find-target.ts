import Fuse from 'fuse.js'

import { wrapActionAndInjectOctokit } from 'src/misc/action-wrapper'
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

export const findTarget = wrapActionAndInjectOctokit(
  { actionName: 'findTarget', errorMessage: 'Failed to find target' },
  async ({ octokit, owner }, { repo, query, channel }) => {
    const targets: Target[] = []

    const queryPullRequests = async () => {
      const pullRequests = await octokit.rest.pulls.list({ owner, repo, per_page: 200, state: 'open' })

      const items = (pullRequests.data || []).map<Target>((item) => ({
        displayName: `${item.number} - ${item.title}`,
        tags: { id: item.number?.toString() },
        channel: 'pullRequest',
      }))

      if (query) {
        fuse.setCollection(items)
        targets.push(...fuse.search<Target>(query).map((x) => x.item))
      } else {
        targets.push(...items)
      }
    }

    const queryIssues = async () => {
      const response = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        per_page: 200,
        state: 'open',
      })

      const { data: allIssues } = response
      const issues = allIssues.filter((issue) => !issue.pull_request)

      const items = (issues || []).map<Target>((item) => {
        const tags: Record<string, string> = {
          id: item.number?.toString(),
        }

        const pushTags = (key: string, value: string | undefined | null) => {
          if (value) {
            tags[key] = value
          }
        }

        pushTags('assigneeId', item.assignee?.id?.toString())
        pushTags('assigneeName', item.assignee?.name)
        pushTags('assigneeLogin', item.assignee?.login)
        pushTags('assigneeEmail', item.assignee?.email)

        return {
          displayName: `${item.number} - ${item.title}`,
          tags,
          channel: 'issue',
        }
      })

      if (query) {
        fuse.setCollection(items)
        targets.push(...fuse.search<Target>(query).map((x) => x.item))
      } else {
        targets.push(...items)
      }
    }

    if (channel === 'pullRequest') {
      await queryPullRequests()
    }
    if (channel === 'issue') {
      await queryIssues()
    }

    return {
      targets,
    }
  }
)
