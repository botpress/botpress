import { Comment, Issue, IssueLabel, LinearClient, Team } from '@linear/sdk'
import { LinearOauthClient } from './linear'
import { AckFunction, MessageHandlerProps } from './types'
import * as bp from '.botpress'

export type LinearClientProps = {
  client: bp.Client
  ctx: bp.Context
}
export function getLinearClient({ client, ctx }: LinearClientProps, integrationId: string) {
  const linearOauthClient = new LinearOauthClient()
  return linearOauthClient.getLinearClient(client, ctx, integrationId)
}

export function dateToString(obj: Date | undefined) {
  return obj ? obj.toISOString() : undefined
}

export function stringToDate(str: string | undefined) {
  return str ? new Date(str) : undefined
}

export function toReturnedIssue(issue: Issue) {
  return {
    ...issue,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    archivedAt: dateToString(issue.archivedAt),
    canceledAt: dateToString(issue.canceledAt),
    completedAt: dateToString(issue.completedAt),
    autoArchivedAt: dateToString(issue.autoArchivedAt),
    autoClosedAt: dateToString(issue.autoClosedAt),
    snoozedUntilAt: dateToString(issue.snoozedUntilAt),
    startedAt: dateToString(issue.startedAt),
    startedTriageAt: dateToString(issue.startedTriageAt),
    triagedAt: dateToString(issue.triagedAt),
  }
}

export function toReturnedComment(comment: Comment) {
  return {
    ...comment,
    archivedAt: dateToString(comment.archivedAt),
    editedAt: dateToString(comment.editedAt),
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  }
}

export function toReturnedIssueLabel(issueLabel: IssueLabel) {
  return {
    ...issueLabel,
    archivedAt: dateToString(issueLabel.archivedAt),
    createdAt: issueLabel.createdAt.toISOString(),
    updatedAt: issueLabel.updatedAt.toISOString(),
  }
}

type ValueOf<T> = T[keyof T]
type CreateCommentProps = Omit<ValueOf<bp.MessageProps['issue']>, 'payload'> & { content: string }
export async function createComment(args: CreateCommentProps) {
  const { ctx, conversation, ack, content } = args
  const linearClient = await getLinearClient(args, ctx.integrationId)
  const issueId = getIssueId(conversation)

  let createAsUser: string | undefined = undefined
  let displayIconUrl: string | undefined = undefined
  if (ctx.configurationType === null) {
    createAsUser = ctx.configuration.displayName
    displayIconUrl = ctx.configuration.avatarUrl
  }

  const res = await linearClient.createComment({
    issueId,
    body: content,
    createAsUser,
    displayIconUrl,
  })
  const comment = await res.comment
  if (!comment) {
    return
  }
  await ackMessage(comment.id, ack)
}

export function getCardContent(card: any) {
  // TODO: fixme
  return `*${card.title}*${card.subtitle ? '\n' + card.subtitle : ''}`
}

export function getIssueId(conversation: MessageHandlerProps['conversation']): string {
  const issueId = conversation.tags.id

  if (!issueId) {
    throw Error(`No issue found for conversation ${conversation.id}`)
  }

  return issueId
}

export async function ackMessage(commentId: string, ack: AckFunction) {
  await ack({ tags: { id: commentId } })
}

export const getIssueTags = async (issue: Issue) => {
  const parent = await issue.parent

  return {
    id: issue.id,
    url: issue.url,
    title: issue.title,
    parentId: parent?.id || '',
    parentTitle: parent?.title || '',
    parentUrl: parent?.url || '',
  }
}

export const getUserAndConversation = async (props: {
  linearUserId: string
  linearIssueId: string
  client: bp.Client
  ctx: bp.Context
  integrationId: string
  forceUpdate?: boolean
}): Promise<{ conversationId: string; userId?: string }> => {
  const { conversation } = await props.client.getOrCreateConversation({
    channel: 'issue',
    tags: {
      id: props.linearIssueId,
    },
  })

  const linearClient = await getLinearClient(props, props.integrationId)

  // TODO: better way to know if the conversation was just created
  if (props.forceUpdate || !conversation.tags.url) {
    const existingIssue = await linearClient.issue(props.linearIssueId)
    const newTags = await getIssueTags(existingIssue)

    await props.client.updateConversation({ id: conversation.id, tags: newTags })
  }

  if (!props.linearUserId) {
    return { conversationId: conversation.id }
  }

  const { user } = await props.client.getOrCreateUser({ tags: { id: props.linearUserId } })
  if (!user.name) {
    const linearUser = await linearClient.user(props.linearUserId)

    await props.client.updateUser({
      id: user.id,
      name: linearUser.name,
      pictureUrl: linearUser.avatarUrl,
      tags: user.tags,
    })
  }

  return {
    userId: user.id,
    conversationId: conversation.id,
  }
}

export const getTeamByName = async (linearClient: LinearClient, name?: string) => {
  const team = await linearClient.teams({ filter: { name: { contains: name } } })
  return team.nodes?.[0]
}

export const getTeam = async (linearClient: LinearClient, teamInstance?: Team, name?: string) => {
  const team = name ? await getTeamByName(linearClient, name) : teamInstance

  return {
    ...team,
    findLabelIds: async (names: string[]) => {
      const labels = await team?.labels({ filter: { name: { in: names } } })
      return labels?.nodes?.map((label) => label.id)
    },
    findProjectId: async (projectName: string) => {
      const projects = await team?.projects({ filter: { name: { contains: projectName } } })
      return projects?.nodes?.map((project) => project.id)?.[0]
    },
  }
}
