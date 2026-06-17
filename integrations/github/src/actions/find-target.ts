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
  async ({ octokit, owner, logger }, { repo, query, channel }) => {
    const targets: Target[] = []

    // Allow the repo input to be a full "owner/repo" path; otherwise fall back
    // to the owner of the connected installation. Note: the installation token
    // can only access repos owned by the account the app is installed on, so
    // the owner here must still be within that installation.
    const slashIndex = repo.indexOf('/')
    const effectiveOwner = slashIndex >= 0 ? repo.slice(0, slashIndex) : owner
    const effectiveRepo = slashIndex >= 0 ? repo.slice(slashIndex + 1) : repo

    logger
      .forBot()
      .info(`findTarget: querying ${effectiveOwner}/${effectiveRepo} channel=${channel} query=${JSON.stringify(query)}`)

    const queryPullRequests = async () => {
      const pullRequests = await octokit.rest.pulls.list({
        owner: effectiveOwner,
        repo: effectiveRepo,
        per_page: 100,
        state: 'open',
      })

      const items = (pullRequests.data || []).map<Target>((item) => ({
        displayName: `${item.number} - ${item.title}`,
        tags: { id: item.number?.toString() },
        channel: 'pullRequest',
      }))

      if (query) {
        fuse.setCollection(items)
        const matched = fuse.search<Target>(query).map((x) => x.item)
        logger
          .forBot()
          .info(`findTarget: pulls.list returned ${items.length} open PRs, ${matched.length} matched query`)
        targets.push(...matched)
      } else {
        logger.forBot().info(`findTarget: pulls.list returned ${items.length} open PRs (no query filter)`)
        targets.push(...items)
      }
    }

    const queryIssues = async () => {
      const response = await octokit.rest.issues.listForRepo({
        owner: effectiveOwner,
        repo: effectiveRepo,
        per_page: 100,
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
        const matched = fuse.search<Target>(query).map((x) => x.item)
        logger
          .forBot()
          .info(`findTarget: issues.listForRepo returned ${items.length} open issues, ${matched.length} matched query`)
        targets.push(...matched)
      } else {
        logger.forBot().info(`findTarget: issues.listForRepo returned ${items.length} open issues (no query filter)`)
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
