import {
  Task as TodoistTask,
  Project as TodoistProject,
  Comment as TodoistComment,
} from '@doist/todoist-api-typescript'
import * as entities from 'definitions/entities'
import { reverseScale } from './common/math-utils'
import { Task, Project, Comment, PickRequired } from '../types'

export namespace ResponseMapping {
  const MAX_PRIORITY = 4
  const MIN_PRIORITY = 1

  export const mapTask = (todoistTask: TodoistTask): Task => ({
    id: todoistTask.id,
    content: todoistTask.content,
    description: todoistTask.description,
    priority: mapPriority(todoistTask.priority),
    projectId: todoistTask.projectId,
    parentTaskId: todoistTask.parentId ?? undefined,
    isCompleted: todoistTask.isCompleted,
    labels: todoistTask.labels,
    createdAt: todoistTask.createdAt,
    dueDate: _mapDueDate(todoistTask.due),
    isRecurringDueDate: todoistTask.due?.isRecurring ?? false,
    createdBy: todoistTask.creatorId,
    assignee: todoistTask.assigneeId ?? undefined,
    assigner: todoistTask.assignerId ?? undefined,
    numberOfComments: todoistTask.commentCount,
    positionWithinParent: todoistTask.order,
    webUrl: todoistTask.url,
    duration: todoistTask.duration ?? undefined,
    sectionId: todoistTask.sectionId ?? undefined,
  })

  export const mapProject = (todoistProject: TodoistProject): Project => ({
    id: todoistProject.id,
    name: todoistProject.name,
    parentProjectId: todoistProject.parentId ?? undefined,
    positionWithinParent: todoistProject.order,
    color: _mapColor(todoistProject.color),
    isFavorite: todoistProject.isFavorite,
    isInboxProject: todoistProject.isInboxProject,
    isShared: todoistProject.isShared,
    isTeamInbox: todoistProject.isTeamInbox,
    numberOfComments: todoistProject.commentCount,
    webUrl: todoistProject.url,
  })

  export const mapTaskComment = (todoistComment: TodoistComment): Comment & PickRequired<Comment, 'taskId'> => ({
    id: todoistComment.id,
    postedAt: todoistComment.postedAt,
    content: todoistComment.content,
    taskId: todoistComment.taskId as string,
  })

  export const mapPriority = (priority: TodoistTask['priority']): Task['priority'] =>
    reverseScale(priority, MIN_PRIORITY, MAX_PRIORITY)

  const _mapDueDate = (dueDate: TodoistTask['due']) => dueDate?.datetime ?? dueDate?.date

  const _mapColor = (color: TodoistProject['color']): Project['color'] =>
    entities.Color.names.includes(color as Project['color']) ? (color as Project['color']) : 'charcoal'
}
