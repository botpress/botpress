import { changeTaskPriority } from './implementations/change-task-priority'
import { createNewTask } from './implementations/create-new-task'
import { getAllProjects } from './implementations/get-all-projects'
import { getAllSections } from './implementations/get-all-sections'
import { getAllTasks } from './implementations/get-all-tasks'
import { getProjectId } from './implementations/get-project-id'
import { getTaskId } from './implementations/get-task-id'

import * as bp from '.botpress'

export const actions = {
  changeTaskPriority,
  getProjectId,
  getTaskId,
  createNewTask,
  getAllProjects,
  getAllSections,
  getAllTasks,
} as const satisfies bp.IntegrationProps['actions']
