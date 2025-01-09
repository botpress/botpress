import {
  Task as TaskEntity,
  Project as ProjectEntity,
  Comment as CommentEntity,
  Section as SectionEntity,
} from 'definitions'

// Entities:
type Task = TaskEntity.InferredType
type BareMinimumTask = PartialExcept<Task, 'content'>

type Project = ProjectEntity.InferredType
type BareMinimumProject = PartialExcept<Project, 'name'>

type Section = SectionEntity.InferredType
type BareMinimumSection = PartialExcept<Section, 'name'>

type Comment = CommentEntity.InferredType
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
type GetAllTasksRequest = {
  projectId?: string
  sectionId?: string
  labelName?: string
}

// Type utilities:

/** Like Pick<T,K>, but each property is required */
type PickRequired<T, K extends keyof T> = { [P in K]-?: T[P] }
/** Makes all properties of T optional, except K, which are all required */
type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & PickRequired<T, K>
