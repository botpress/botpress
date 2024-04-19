import { Octokit } from 'octokit'
import { RegisterFunction, UnregisterFunction } from './misc/types'

export const register: RegisterFunction = async ({ ctx, webhookUrl, client }) => {
  const { owner, repo, token } = ctx.configuration

  const octokit = new Octokit({ auth: token })
  const secret = `secret-${Math.random()}`

  const alreadyRegistered = (await octokit.rest.repos.listWebhooks({ owner, repo })).data.find(
    (w) => w.config.url === webhookUrl
  )

  if (alreadyRegistered) {
    await octokit.rest.repos.deleteWebhook({ owner, repo, hook_id: alreadyRegistered.id })
  }

  const webhook = (
    await octokit.rest.repos.createWebhook({
      owner,
      repo,
      config: { url: webhookUrl, secret, content_type: 'json' },
      events: ['pull_request', 'issue_comment', 'issues', 'discussion', 'discussion_comment'],
    })
  ).data

  const botUserId = (await octokit.rest.users.getAuthenticated()).data.id
  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { webhookSecret: secret, webhookId: webhook.id, botUserId },
  })
}

export const unregister: UnregisterFunction = async ({ ctx, client, logger }) => {
  const { owner, repo, token } = ctx.configuration

  const { state } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  const octokit = new Octokit({ auth: token })
  if (!state.payload.webhookId) {
    logger.forBot().error('Unable to remove webhook from github: Webhook id not found')
    return
  }

  await octokit.rest.repos.deleteWebhook({ owner, repo, hook_id: state.payload.webhookId })
}
