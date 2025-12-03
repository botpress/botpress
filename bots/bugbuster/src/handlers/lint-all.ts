import * as boot from '../bootstrap'
import * as utils from '../utils'
import * as bp from '.botpress'

export const handleLintAll: bp.WorkflowHandlers['lintAll'] = async (props) => {
  const { client, workflow, conversation } = props

  const conversationId = conversation?.id

  const { botpress, issueProcessor } = await boot.bootstrap(props, conversationId)

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

  const issues = await issueProcessor
    .listRelevantIssues(lastLintedId) // TODO: we should not list all issues at first, bug fetch next page and lint progressively
    .catch(_handleError('trying to list all issues'))

  for (const issue of issues) {
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
