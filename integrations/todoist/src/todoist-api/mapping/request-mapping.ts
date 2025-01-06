import { Task as TodoistTask, AddTaskArgs, UpdateTaskArgs } from '@doist/todoist-api-typescript'
import { CreateTaskRequest, Task, UpdateTaskRequest } from '../types'
import { reverseScale } from './common/math-utils'

export namespace RequestMapping {
  const MAX_PRIORITY = 1
  const MIN_PRIORITY = 4

  export const mapCreateTask = (task: CreateTaskRequest): AddTaskArgs => ({
    content: task.content,
    description: task.description,
    projectId: task.projectId,
    sectionId: task.sectionId,
    parentId: task.parentTaskId,
    order: task.positionWithinParent,
    labels: task.labels,
    priority: _mapPriority(task.priority ?? MIN_PRIORITY),
    dueString: task.dueDate,
    assigneeId: task.assignee,
    ..._mapDuration(task.duration),
  })

  export const mapUpdateTask = (task: UpdateTaskRequest): UpdateTaskArgs => ({
    content: task.content,
    description: task.description,
    labels: task.labels,
    priority: _mapPriority(task.priority ?? MIN_PRIORITY),
    dueString: task.dueDate,
    assigneeId: task.assignee,
    ..._mapDuration(task.duration),
  })

  const _mapPriority = (priority: Task['priority']): TodoistTask['priority'] =>
    reverseScale(priority, MIN_PRIORITY, MAX_PRIORITY)

  const _mapDuration = (duration: Task['duration']) =>
    duration ? { duration: duration.amount, durationUnit: duration.unit } : {}
}
