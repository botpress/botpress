import * as sdk from '@botpress/sdk'
import {
  createTaskInputSchema,
  createTaskOutputSchema,
  updateTaskInputSchema,
  updateTaskOutputSchema,
  findUserInputSchema,
  findUserOutputSchema,
  addCommentToTaskInputSchema,
  addCommentToTaskOutputSchema,
} from '../misc/custom-schemas'

type SdkActions = NonNullable<sdk.IntegrationDefinitionProps['actions']>
type SdkAction = SdkActions[string]

const createTask = {
  title: 'Create Task',
  description: 'Create Task',
  input: {
    schema: createTaskInputSchema,
  },
  output: {
    schema: createTaskOutputSchema,
  },
} satisfies SdkAction

const updateTask = {
  title: 'Update Task',
  description: 'Update Task by taskId',
  input: {
    schema: updateTaskInputSchema,
  },
  output: {
    schema: updateTaskOutputSchema,
  },
} satisfies SdkAction

const findUser = {
  title: 'Find User',
  description: 'Find User by userId',
  input: {
    schema: findUserInputSchema,
  },
  output: {
    schema: findUserOutputSchema,
  },
} satisfies SdkAction

const addCommentToTask = {
  title: 'Add Comment to Task',
  description: 'Add Comment to Task, by task ID',
  input: {
    schema: addCommentToTaskInputSchema,
  },
  output: {
    schema: addCommentToTaskOutputSchema,
  },
} satisfies SdkAction

export const actions = {
  createTask,
  updateTask,
  findUser,
  addCommentToTask,
} satisfies SdkActions
