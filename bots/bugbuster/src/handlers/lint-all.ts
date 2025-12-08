import * as types from 'src/types'
import * as boot from '../bootstrap'
import * as bp from '.botpress'

export const handleLintAll: bp.WorkflowHandlers['lintAll'] = async (props) => {
  const { client, workflow, ctx, conversation } = props

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
    for (const issue of pagedIssues.issues) {
      const lintResult = await issueProcessor
        .lintIssue(issue)
        .catch(_handleError(`trying to lint issue ${issue.identifier}`))
      lintResults.push(lintResult)

      await workflow.acknowledgeStartOfProcessing().catch(_handleError('trying to acknowledge start of processing'))
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
    }

    hasNextPage = pagedIssues.pagination?.hasNextPage ?? false
    endCursor = pagedIssues.pagination?.endCursor
  } while (hasNextPage)

  if (conversation?.id) {
    await botpress.respondText(conversation.id, _buildResultMessage(lintResults)).catch(() => {})
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
    const conversationId = await _getConversationId(client, channel.name).catch(
      _handleError(`trying to get the conversation ID of Slack channel '${channel.name}'`)
    )

    const relevantIssues = lintResults.filter((result) =>
      channel.teams.some((team) => result.identifier.includes(team))
    )

    await botpress.respondText(conversationId, _buildResultMessage(relevantIssues)).catch(() => {})
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

const _buildResultMessage = (results: types.LintResult[]) => {
  const failedIssuesLinks = results.filter((result) => result.result === 'failed').map((result) => result.identifier)

  let messageDetail = 'No issue contained lint errors.'
  if (failedIssuesLinks.length === 1) {
    messageDetail = `This issue contained lint errors: ${failedIssuesLinks[0]}.`
  } else if (failedIssuesLinks.length > 1) {
    messageDetail = `These issues contained lint errors: ${failedIssuesLinks.join(', ')}.`
  }

  return `Linting complete. ${messageDetail}`
}

const _getConversationId = async (client: bp.Client, channelName: string) => {
  const conversation = await client.callAction({
    type: 'slack:startChannelConversation',
    input: {
      channelName,
    },
  })
  return conversation.output.conversationId
}
