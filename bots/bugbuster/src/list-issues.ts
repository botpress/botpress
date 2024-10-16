import * as bp from '.botpress'

type GithubIssue = bp.integrations.github.actions.findTarget.output.Output['targets'][number]
export const listIssues = async (props: bp.EventHandlerProps | bp.MessageHandlerProps): Promise<GithubIssue[]> => {
  const { client } = props
  const {
    output: { targets: githubIssues },
  } = await client.callAction({
    type: 'github:findTarget',
    input: {
      channel: 'issue',
      repo: 'botpress',
      query: '',
    },
  })
  return githubIssues
}
