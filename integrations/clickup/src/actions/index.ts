import { createTask } from './createTask'
import { deleteTask } from './deleteTask'
import { getListMembers } from './getListMembers'
import { updateTask } from './updateTask'
import * as bp from '.botpress'

export default {
  createTask,
  updateTask,
  deleteTask,
  getListMembers,
} as const satisfies bp.IntegrationProps['actions']
