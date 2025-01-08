import { Task as TaskEntity, Project as ProjectEntity, Comment as CommentEntity } from 'definitions'

// Entities:
type Task = TaskEntity.inferredType
type BareMinimumTask = PartialExcept<Task, 'content'>

type Project = ProjectEntity.inferredType
type BareMinimumProject = PartialExcept<Project, 'name'>

type Comment = CommentEntity.inferredType
type BareMinimumComment = PartialExcept<Comment, 'content'>

// Action requests:
type CreateTaskRequest = Omit<
  BareMinimumTask,
  'id' | 'webUrl' | 'isCompleted' | 'isRecurringDueDate' | 'numberOfComments' | 'createdAt' | 'createdBy' | 'assigner'
>
type UpdateTaskRequest = Omit<
  PartialExcept<Task, 'id'>,
  | 'projectId'
  | 'sectionId'
  | 'isCompleted'
  | 'parentTaskId'
  | 'positionWithinParent'
  | 'isRecurringDueDate'
  | 'webUrl'
  | 'numberOfComments'
  | 'createdAt'
  | 'createdBy'
  | 'assigner'
>

// Type utilities:

/** Like Pick<T,K>, but each property is required */
type PickRequired<T, K extends keyof T> = { [P in K]-?: T[P] }
/** Makes all properties of T optional, except K, which are all required */
type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & PickRequired<T, K>
