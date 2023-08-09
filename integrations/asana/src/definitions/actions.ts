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
import { createTaskUi, updateTaskUi, findUserUi, addCommentToTaskUi } from '../misc/custom-uis'

const createTask = {
  title: 'Create Task',
  description: 'Create Task',
  input: {
    schema: createTaskInputSchema,
    ui: createTaskUi,
  },
  output: {
    schema: createTaskOutputSchema,
  },
}

const updateTask = {
  title: 'Update Task',
  description: 'Update Task by taskId',
  input: {
    schema: updateTaskInputSchema,
    ui: updateTaskUi,
  },
  output: {
    schema: updateTaskOutputSchema,
  },
}

const findUser = {
  title: 'Find User',
  description: 'Find User by userId',
  input: {
    schema: findUserInputSchema,
    ui: findUserUi,
  },
  output: {
    schema: findUserOutputSchema,
  },
}

const addCommentToTask = {
  title: 'Add Comment to Task',
  description: 'Add Comment to Task, by task ID',
  input: {
    schema: addCommentToTaskInputSchema,
    ui: addCommentToTaskUi,
  },
  output: {
    schema: addCommentToTaskOutputSchema,
  },
}

export const actions = {
  createTask,
  updateTask,
  findUser,
  addCommentToTask,
}
