import { RuntimeError } from '@botpress/client'
import { GitHubClient } from './github-client'
import * as bp from '.botpress'

import * as types from './types'

type GitHubUser = {
  login: string
  avatar_url: string
  html_url: string
  node_id: string
  id: number
}
export const getOrCreateBotpressUserFromGithubUser = async ({
  githubUser,
  client,
}: {
  githubUser: GitHubUser
  client: types.Client
}) => {
  const { users } = await client.listUsers({
    tags: {
      nodeId: githubUser.node_id,
    },
  })

  if (users.length && users[0]) {
    return users[0]
  }

  const { user } = await client.createUser({
    name: githubUser.login,
    pictureUrl: githubUser.avatar_url,
    tags: {
      handle: githubUser.login,
      nodeId: githubUser.node_id,
      id: githubUser.id.toString(),
      profileUrl: githubUser.html_url,
    },
  })

  return user
}

type GitHubPullRequest = {
  number: number
  node_id: string
  html_url: string
  repository: {
    id: number
    name: string
    node_id: string
    owner: {
      id: number
      login: string
      html_url: string
    }
    html_url: string
  }
}
export const getOrCreateBotpressConversationFromGithubPR = async ({
  githubPullRequest,
  client,
}: {
  githubPullRequest: GitHubPullRequest
  client: types.Client
}) =>
  (await getConversationFromTags<'pullRequest'>(client, {
    channel: 'pullRequest',
    pullRequestNodeId: githubPullRequest.node_id,
  })) ??
  (
    await client.createConversation({
      channel: 'pullRequest',
      tags: {
        channel: 'pullRequest',
        pullRequestNodeId: githubPullRequest.node_id,
        pullRequestNumber: githubPullRequest.number.toString(),
        pullRequestUrl: githubPullRequest.html_url,
        repoId: githubPullRequest.repository.id.toString(),
        repoName: githubPullRequest.repository.name,
        repoNodeId: githubPullRequest.repository.node_id,
        repoOwnerId: githubPullRequest.repository.owner.id.toString(),
        repoOwnerName: githubPullRequest.repository.owner.login,
        repoOwnerUrl: githubPullRequest.repository.owner.html_url,
        repoUrl: githubPullRequest.repository.html_url,
      },
    })
  ).conversation

export const getOrCreateBotpressConversationFromGithubIssue = async ({
  githubIssue,
  client,
}: {
  githubIssue: GitHubPullRequest
  client: types.Client
}) =>
  (await getConversationFromTags<'issue'>(client, { issueNodeId: githubIssue.node_id })) ??
  (
    await client.createConversation({
      channel: 'issue',
      tags: {
        issueNodeId: githubIssue.node_id,
        issueNumber: githubIssue.number.toString(),
        issueUrl: githubIssue.html_url,
        repoId: githubIssue.repository.id.toString(),
        repoName: githubIssue.repository.name,
        repoNodeId: githubIssue.repository.node_id,
        repoOwnerId: githubIssue.repository.owner.id.toString(),
        repoOwnerName: githubIssue.repository.owner.login,
        repoOwnerUrl: githubIssue.repository.owner.html_url,
        repoUrl: githubIssue.repository.html_url,
      },
    })
  ).conversation

type GitHubDiscussion = GitHubPullRequest & {
  id: number
  category: {
    id: number
    name: string
    node_id: string
  }
}

export const getOrCreateBotpressConversationFromGithubDiscussion = async ({
  githubDiscussion,
  client,
}: {
  githubDiscussion: GitHubDiscussion
  client: types.Client
}) =>
  (await getConversationFromTags<'discussion'>(client, { discussionNodeId: githubDiscussion.node_id })) ??
  (
    await client.createConversation({
      channel: 'discussion',
      tags: {
        discussionNodeId: githubDiscussion.node_id,
        discussionNumber: githubDiscussion.number.toString(),
        discussionUrl: githubDiscussion.html_url,
        discussionId: githubDiscussion.id.toString(),
        discussionCategoryId: githubDiscussion.category.id.toString(),
        discussionCategoryName: githubDiscussion.category.name,
        discussionCategoryNodeId: githubDiscussion.category.node_id,
        repoId: githubDiscussion.repository.id.toString(),
        repoName: githubDiscussion.repository.name,
        repoNodeId: githubDiscussion.repository.node_id,
        repoOwnerId: githubDiscussion.repository.owner.id.toString(),
        repoOwnerName: githubDiscussion.repository.owner.login,
        repoOwnerUrl: githubDiscussion.repository.owner.html_url,
        repoUrl: githubDiscussion.repository.html_url,
      },
    })
  ).conversation

type GitHubDiscussionReply = GitHubDiscussion & {
  comment: {
    parent_id: number
  }
}

export const getOrCreateBotpressConversationFromGithubDiscussionReply = async ({
  githubDiscussion,
  client,
}: {
  githubDiscussion: GitHubDiscussionReply
  client: types.Client
}) =>
  (await getConversationFromTags<'discussionComment'>(client, { discussionNodeId: githubDiscussion.node_id })) ??
  (
    await client.createConversation({
      channel: 'discussionComment',
      tags: {
        discussionNodeId: githubDiscussion.node_id,
        discussionNumber: githubDiscussion.number.toString(),
        discussionUrl: githubDiscussion.html_url,
        discussionId: githubDiscussion.id.toString(),
        discussionCategoryId: githubDiscussion.category.id.toString(),
        discussionCategoryName: githubDiscussion.category.name,
        discussionCategoryNodeId: githubDiscussion.category.node_id,
        parentCommentId: githubDiscussion.comment.parent_id.toString(),
        repoId: githubDiscussion.repository.id.toString(),
        repoName: githubDiscussion.repository.name,
        repoNodeId: githubDiscussion.repository.node_id,
        repoOwnerId: githubDiscussion.repository.owner.id.toString(),
        repoOwnerName: githubDiscussion.repository.owner.login,
        repoOwnerUrl: githubDiscussion.repository.owner.html_url,
        repoUrl: githubDiscussion.repository.html_url,
      },
    })
  ).conversation

export const getConversationFromTags = async <E extends keyof types.Channels>(
  client: types.Client,
  tags: Partial<{ channel: E } & Record<keyof bp.channels.Channels[E]['conversation']['tags'], string>>
) => {
  const { conversations } = await client.listConversations({
    tags,
  })

  return conversations.length === 1 ? conversations[0] ?? null : null
}
