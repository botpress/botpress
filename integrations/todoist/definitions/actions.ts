import sdk, { z } from '@botpress/sdk'
import { Task, Project, Section, SharedLabel } from './entities'

export const actions = {
  changeTaskPriority: {
    title: 'Change Task Priority',
    description: 'Change the priority of a task',
    input: {
      schema: z.object({
        taskId: Task.schema.shape.id,
        priority: Task.schema.shape.priority,
      }),
    },
    output: {
      schema: z.object({}),
    },
  },
  getTaskId: {
    title: 'Get Task ID',
    description: 'Get the ID of the first task matching the given name',
    input: {
      schema: z.object({
        name: z.string().title('Name').describe('The name of the task to search for'),
        // NOTE: this actually refers to the `content` property of the Task
        //       entity: the `name` property does not exist
      }),
    },
    output: {
      schema: z.object({
        taskId: Task.schema.shape.id.nullable(),
      }),
    },
  },
  getProjectId: {
    title: 'Get Project ID',
    description: 'Get the ID of the project',
    input: {
      schema: z.object({
        name: Project.schema.shape.name,
      }),
    },
    output: {
      schema: z.object({
        projectId: Project.schema.shape.id.nullable(),
      }),
    },
  },
  getAllProjects: {
    title: 'Get All Projects',
    description: 'Get all projects',
    input: {
      schema: z.object({}),
    },
    output: {
      schema: z.object({
        projects: z.array(Project.schema).title('Projects').describe('All projects that are available to the user'),
      }),
    },
  },
  getAllSections: {
    title: 'Get All Sections',
    description: 'Get all sections in a project',
    input: {
      schema: z.object({
        projectId: Project.schema.shape.id
          .optional()
          .title('Project ID (optional)')
          .describe('The ID of the project. If omitted, the sections of all projects will be returned.'),
      }),
    },
    output: {
      schema: z.object({
        sections: z
          .array(Section.schema)
          .title('Sections')
          .describe('All sections in the project, or all sections in all projects if projectId is omitted'),
      }),
    },
  },
  getAllTasks: {
    title: 'Get All Tasks',
    description: 'Find tasks using optional filters',
    input: {
      schema: z.object({
        projectId: Project.schema.shape.id
          .optional()
          .title('Filter by Project ID (optional)')
          .describe('The ID of the project. If omitted, tasks from all projects will be included in the results.'),
        sectionId: Section.schema.shape.id
          .optional()
          .title('Filter by Section ID (optional)')
          .describe('The ID of the section. If omitted, tasks from all sections will be included in the results.'),
        labelName: SharedLabel.schema.shape.name
          .optional()
          .title('Filter by Label Name (optional)')
          .describe('The name of the label. If omitted, tasks with any label will be included in the results.'),
      }),
    },
    output: {
      schema: z.object({
        tasks: z.array(Task.schema).title('Tasks').describe('All matching tasks'),
      }),
    },
  },
  createNewTask: {
    title: 'Create New Task',
    description: 'Create a new task',
    input: {
      schema: z.object({
        content: Task.schema.shape.content,
        description: Task.schema.shape.description.optional(),
        projectId: Project.schema.shape.id
          .optional()
          .title('Project ID (optional)')
          .describe("The ID of the project. If omitted, the task will be added to the user's Inbox."),
        sectionId: Section.schema.shape.id
          .optional()
          .title('Section ID (optional)')
          .describe('The ID of section to put task into.'),
        labelNames: z
          .array(SharedLabel.schema.shape.name)
          .optional()
          .title('Label Names (optional)')
          .describe('The names of the labels to add to the task. If omitted, no label will be added.'),
        parentTaskId: Task.schema.shape.id
          .optional()
          .title('Parent Task ID (optional)')
          .describe('The ID of the parent task. If omitted, the task will have no parent task.'),
        priority: Task.schema.shape.priority
          .optional()
          .title('Priority (optional)')
          .describe('The priority level of the task, from 1 (normal) to 4 (urgent).'),
        dueDate: Task.schema.shape.dueDate
          .optional()
          .title('Due Date')
          .describe(
            'The due date of the task. Must be in RFC3339 format in UTC. If omitted, the task will have no due date.'
          ),
      }),
    },
    output: {
      schema: z.object({
        taskId: Task.schema.shape.id,
      }),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
