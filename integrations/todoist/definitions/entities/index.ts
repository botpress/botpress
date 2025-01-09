import sdk from '@botpress/sdk'

import { Color } from './color'
import { Comment } from './comment'
import { PersonalLabel } from './personal-label'
import { Project } from './project'
import { Section } from './section'
import { SharedLabel } from './shared-label'
import { Task } from './task'

export { Comment, PersonalLabel, Project, Section, SharedLabel, Task, Color }

export const entities = {
  task: {
    title: 'Task',
    description: 'A task in Todoist',
    schema: Task.schema,
  },
  project: {
    title: 'Project',
    description: 'A project in Todoist',
    schema: Project.schema,
  },
  section: {
    title: 'Section',
    description: 'A section in a Todoist project',
    schema: Section.schema,
  },
  comment: {
    title: 'Comment',
    description: 'A comment on a Todoist task',
    schema: Comment.schema,
  },
  personalLabel: {
    title: 'Personal Label',
    description: 'A personal label in Todoist',
    schema: PersonalLabel.schema,
  },
  sharedLabel: {
    title: 'Shared Label',
    description: 'A shared label in Todoist',
    schema: SharedLabel.schema,
  },
} as const satisfies sdk.IntegrationDefinitionProps['entities']
