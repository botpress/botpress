import { Octokit } from 'octokit'
import { CreateConversationFunction, CreateUserFunction, RegisterFunction, UnregisterFunction } from './misc/types'

export const register: RegisterFunction = async ({ ctx, webhookUrl, client }) => {
  const { owner, repo, token } = ctx.configuration

  const octokit = new Octokit({ auth: token })
  const secret = `secret-${Math.random()}`

  const webhook = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config: { url: webhookUrl, secret, content_type: 'json' },
    events: ['pull_request', 'issue_comment', 'issues', 'discussion', 'discussion_comment'],
  })

  const botUserId = (await octokit.rest.users.getAuthenticated()).data.id
  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { webhookSecret: secret, webhookId: webhook.data.id, botUserId },
  })
}

export const unregister: UnregisterFunction = async ({ ctx, client }) => {
  const { owner, repo, token } = ctx.configuration

  const { state } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  const octokit = new Octokit({ auth: token })
  await octokit.rest.repos.deleteWebhook({ owner, repo, hook_id: state.payload.webhookId })
}

export const createUser: CreateUserFunction = async () => {
  // not necessary
}

export const createConversation: CreateConversationFunction = async () => {
  // not necessary
}
