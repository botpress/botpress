import { changeTaskPriority } from './implementations/change-task-priority'
import { getProjectId } from './implementations/get-project-id'
import { getTaskId } from './implementations/get-task-id'

import { taskCreate } from './implementations/interfaces/task-create'

import * as bp from '.botpress'

export const actions = {
  changeTaskPriority,
  getProjectId,
  getTaskId,

  taskCreate,
} as const satisfies bp.IntegrationProps['actions']
