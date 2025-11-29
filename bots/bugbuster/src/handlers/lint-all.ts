import * as boot from '../bootstrap'
import * as utils from '../utils'
import * as bp from '.botpress'

export const handleLintAll: bp.WorkflowHandlers['lintAll'] = async (props) => {
  const { client, workflow, conversation } = props

  const conversationId = conversation?.id

  const { botpress, issueProcessor } = boot.bootstrap(props)

  const _handleError = (context: string) => (thrown: unknown) =>
    botpress.handleError({ context, conversationId }, thrown)

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

  let hasNextPage = false
  let endCursor: string | undefined = lastLintedId
  do {
    const pagedIssues = await issueProcessor
      .listRelevantIssues(endCursor)
      .catch(_handleError('trying to list all issues'))

    for (const issue of pagedIssues.issues) {
      await issueProcessor.lintIssue(issue).catch(_handleError(`trying to lint issue ${issue.identifier}`))
      await workflow.acknowledgeStartOfProcessing().catch(_handleError('trying to acknowledge start of processing'))
      await client
        .setState({
          id: workflow.id,
          name: 'lastLintedId',
          type: 'workflow',
          payload: { id: issue.id },
        })
        .catch(_handleError('trying to update last linted issue ID'))
    }
    hasNextPage = pagedIssues.pagination?.hasNextPage ?? false
    endCursor = pagedIssues.pagination?.endCursor
  } while (hasNextPage)

  if (conversationId) {
    await botpress.respondText(conversationId, 'linted all issues').catch(() => {})
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
