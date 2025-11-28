import * as types from 'src/types'
import * as boot from '../bootstrap'
import * as utils from '../utils'
import * as bp from '.botpress'

export const handleLintAll: bp.WorkflowHandlers['lintAll'] = async (props) => {
  const { client, workflow, conversation } = props

  const conversationId = conversation?.id

  const { botpress, issueProcessor } = boot.bootstrap(props)

  const _handleError = (context: string) => (thrown: unknown) =>
    botpress.handleError({ context, conversationId }, thrown)

  const _handleErrorWhileLinting =
    (context: string, lastLintedId: string, lintResults: types.LintResult[]) => async (thrown: unknown) => {
      await Promise.all([
        client
          .setState({
            id: workflow.id,
            name: 'lastLintedId',
            type: 'workflow',
            payload: { id: lastLintedId },
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
      return _handleError(context)(thrown)
    }

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
    for (const issue of pagedIssues.issues) {
      const lintResult = await issueProcessor
        .lintIssue(issue)
        .catch(_handleErrorWhileLinting(`trying to lint issue ${issue.identifier}`, issue.id, lintResults))
      lintResults.push(lintResult)

      await workflow
        .acknowledgeStartOfProcessing()
        .catch(_handleErrorWhileLinting('trying to acknowledge start of processing', issue.id, lintResults))
    }

    hasNextPage = pagedIssues.pagination?.hasNextPage ?? false
    endCursor = pagedIssues.pagination?.endCursor
  } while (hasNextPage)

  if (conversationId) {
    await botpress.respondText(conversationId, _buildResultMessage(lintResults)).catch(() => {})
  }

  await workflow.setCompleted()
}

export const handleLintAllTimeout: bp.WorkflowHandlers['lintAll'] = async (props) => {
  const { conversation } = props

  const botpress = utils.botpress.BotpressApi.create(props)
  if (conversation?.id) {
    await botpress.respondText(conversation.id, "Error: the 'lintAll' operation timed out")
  }
}

const _buildResultMessage = (results: types.LintResult[]) => {
  const failedIssuesLinks = results.filter((result) => result.result === 'failed').map((result) => result.identifier)

  let messageDetail = 'No issue contained lint errors.'
  if (failedIssuesLinks.length === 1) {
    messageDetail = `This issue contained lint errors: ${failedIssuesLinks[0]}.`
  } else if (failedIssuesLinks.length > 1) {
    messageDetail = `These issues contained lint errors: ${failedIssuesLinks.join(', ')}.`
  }

  return `All issues linted. ${messageDetail}`
}
