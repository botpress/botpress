import * as boot from '../bootstrap'
import * as types from '../types'
import * as bp from '.botpress'

const LINEAR_ISSUE_BASE_URL = 'https://linear.app/botpress/issue/'

export const handleLintAll: bp.WorkflowHandlers['lintAll'] = async (props) => {
  const { client, workflow, ctx, conversation } = props

  const verbose = workflow.input.verbose ?? false
  const comment = workflow.input.comment ?? true

  const { botpress, issueProcessor } = boot.bootstrap(props)

  const _handleError = (context: string) => (thrown: unknown) => botpress.handleError({ context }, thrown)

  const {
    state: {
      payload: { id: lastLintedId },
    },
  } = await client
    .getOrSetState({
      id: workflow.id,
      name: 'lastLintedId',
      type: 'workflow',
      payload: {},
    })
    .catch(_handleError('trying to get last linted issue ID'))

  const {
    state: {
      payload: { issues: lintResults },
    },
  } = await client
    .getOrSetState({
      id: workflow.id,
      name: 'lintResults',
      type: 'workflow',
      payload: { issues: [] },
    })
    .catch(_handleError('trying to get previous lint results'))

  let hasNextPage = false
  let endCursor: string | undefined = lastLintedId
  do {
    const pagedIssues = await issueProcessor
      .listRelevantIssues(endCursor)
      .catch(_handleError('trying to list all issues'))

    const pageResults: types.LintResult[] = []
    for (const issue of pagedIssues.issues) {
      const lintResult = await issueProcessor
        .lintIssue(issue, { comment })
        .catch(_handleError(`trying to lint issue ${issue.identifier}`))
      lintResults.push(lintResult)
      pageResults.push(lintResult)

      await workflow.acknowledgeStartOfProcessing().catch(_handleError('trying to acknowledge start of processing'))

      endCursor = issue.id

      await Promise.all([
        client
          .setState({
            id: workflow.id,
            name: 'lastLintedId',
            type: 'workflow',
            payload: { id: endCursor },
          })
          .catch(_handleError('trying to update last linted issue ID')),
        client
          .setState({
            id: workflow.id,
            name: 'lintResults',
            type: 'workflow',
            payload: { issues: lintResults },
          })
          .catch(_handleError('trying to update lint results')),
      ])
    }

    hasNextPage = pagedIssues.pagination?.hasNextPage ?? false

    if (verbose && conversation?.id) {
      const failedCount = lintResults.filter((result) => result.result === 'failed').length
      const newlyFailed = pageResults.filter((result) => result.result === 'failed')

      const progressLine = `Linting... linted ${lintResults.length} issue(s) so far (${failedCount} with errors).`
      const failedList = newlyFailed.map((result) => `- ${_issueLink(result.identifier)}`).join('\n')
      const message = newlyFailed.length > 0 ? `${progressLine}\n${failedList}` : progressLine

      await botpress.respondText(conversation.id, message).catch(() => {})
    }
  } while (hasNextPage)

  if (conversation?.id) {
    const message = _buildResultMessage(lintResults)
    await botpress.respondText(conversation.id, message).catch(() => {})
    await workflow.setCompleted()
    return
  }

  const {
    state: {
      payload: { channels },
    },
  } = await client.getOrSetState({
    id: ctx.botId,
    name: 'notificationChannels',
    type: 'bot',
    payload: { channels: [] },
  })

  for (const channel of channels) {
    const relevantIssues = lintResults.filter((result) =>
      channel.teams.some((team) => result.identifier.includes(team))
    )

    if (relevantIssues.length > 0) {
      await botpress.respondText(channel.conversationId, _buildResultMessage(relevantIssues)).catch(() => {})
    }
  }

  await workflow.setCompleted()
}

export const handleLintAllTimeout: bp.WorkflowHandlers['lintAll'] = async (props) => {
  const { conversation } = props
  const { botpress } = boot.bootstrap(props)

  if (conversation?.id) {
    await botpress.respondText(conversation.id, "Error: the 'lintAll' operation timed out")
  }
}

const _issueLink = (identifier: string) => `[${identifier}](${LINEAR_ISSUE_BASE_URL + identifier})`

const _buildResultMessage = (results: types.LintResult[]) => {
  const failedIssuesLinks = results
    .filter((result) => result.result === 'failed')
    .slice(0, 10) // Limit to 10 issues to avoid spamming the message
    .map((result) => _issueLink(result.identifier))

  let messageDetail = 'No issue contained lint errors.'
  if (failedIssuesLinks.length === 1) {
    messageDetail = `This issue contained lint errors: ${failedIssuesLinks[0]}.`
  } else if (failedIssuesLinks.length > 1) {
    messageDetail = `These issues contained lint errors: ${failedIssuesLinks.join(', ')}.`
  }

  return `Linting complete. ${messageDetail}`
}
