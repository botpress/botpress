import { listIssues } from '../list-issues'
import * as listeners from '../listeners'
import * as bp from '.botpress'

/**
 * checks if all issues in GitHub are assigned to someone
 * if not, sends a DM to listeners of the bot
 */
export const handleSyncIssuesRequest: bp.EventHandlers['syncIssuesRequest'] = async (props) => {
  try {
    const githubIssues = await listIssues(props)

    const unassignedIssues = githubIssues
      .map((issue) =>
        issue.tags['id']
          ? {
              displayName: issue.displayName,
              id: issue.tags['id'],
              assigneeId: issue.tags['assigneeId'],
            }
          : null
      )
      .filter(<T>(i: T | null): i is T => i !== null)
      .filter((issue) => !issue.assigneeId)

    if (!unassignedIssues.length) {
      console.info('All issues are assigned in GitHub')
      return
    }

    const message = [
      'The following issues are not assigned in GitHub:',
      ...unassignedIssues.map((issue) => `\t${issue.displayName}`),
    ].join('\n')
    console.info(message)

    await listeners.notifyListeners(props, {
      type: 'text',
      payload: {
        text: message,
      },
    })
  } catch (thrown) {
    // If recurring event fails to many times, bridge stops sending it... We don't want that
    const err = thrown instanceof Error ? thrown : new Error(`${thrown}`)
    console.error(err.message)
  }
}
