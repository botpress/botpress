import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { Client, Priority } from './client'
import { getAccessToken, NO_ACCESS_TOKEN_ERROR } from './auth'
import { emptyStrToUndefined } from './utils'

const taskCreate: bp.IntegrationProps['actions']['taskCreate'] = async ({ input, ctx, client }) => {
  const accessToken = await getAccessToken(client, ctx)
  if (!accessToken) {
    throw new RuntimeError(NO_ACCESS_TOKEN_ERROR)
  }

  const { content, description, priority, projectId, parentTaskId } = input.item
  console.log('taskCreate', JSON.stringify(input))
  const todoistClient = new Client(accessToken)
  const task = await todoistClient.createTask({
    content,
    description,
    priority: new Priority(priority),
    project_id: emptyStrToUndefined(projectId),
    parentTaskId: emptyStrToUndefined(parentTaskId),
  })
 
  return {
    item: {
      ...task, 
    },
  } 
}

const changeTaskPriority: bp.IntegrationProps['actions']['changeTaskPriority'] = async ({ input, ctx, client }) => {
  const { taskId, priority } = input

  const accessToken = await getAccessToken(client, ctx)
  if (!accessToken) {
    throw new RuntimeError(NO_ACCESS_TOKEN_ERROR)
  }

  const todoistClient = new Client(accessToken)
  await todoistClient.changeTaskPriority(taskId, new Priority(priority))
  return {}
}

const getTaskId: bp.IntegrationProps['actions']['getTaskId'] = async ({ input, ctx, client }) => {
  const { name } = input

  const accessToken = await getAccessToken(client, ctx)
  if (!accessToken) {
    throw new RuntimeError(NO_ACCESS_TOKEN_ERROR)
  }

  const todoistClient = new Client(accessToken)
  const taskId = await todoistClient.getTaskId(name)
  return { taskId }
}

const getProjectId: bp.IntegrationProps['actions']['getProjectId'] = async ({ input, ctx, client }) => {
  const { name } = input

  const accessToken = await getAccessToken(client, ctx)
  if (!accessToken) {
    throw new RuntimeError(NO_ACCESS_TOKEN_ERROR)
  }

  const todoistClient = new Client(accessToken)
  const projectId = await todoistClient.getProjectId(name)
  return { projectId }
}

export default {
  taskCreate,
  changeTaskPriority,
  getTaskId,
  getProjectId,
} satisfies bp.IntegrationProps['actions']
