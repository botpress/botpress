export const taskUi = {
  name: {
    title: 'The name of the task (e.g. "My Test Task")',
  },
  notes: {
    title: 'The description of the task (Optional) (e.g. "This is my other task created using the Asana API")',
  },
  assignee: {
    title:
      'The ID of the user who will be assigned to the task or "me" to assign to the current user (Optional) (e.g. "1215207682932839") (Default: "me")',
  },
  projects: {
    title:
      'The project IDs should be strings separated by commas (Optional) (e.g. "1205199808673678, 1215207282932839").',
  },
  parent: {
    title: 'The ID of the parent task (Optional) (e.g. "1205206556256028")',
  },
  start_on: {
    title: 'The start date of the task in YYYY-MM-DD format (Optional) (e.g. "2023-08-13")',
  },
  due_on: {
    title: 'The due date of the task without a specific time in YYYY-MM-DD format (Optional) (e.g. "2023-08-15")',
  },
}

export const createTaskUi = taskUi

export const updateTaskUi = {
  ...taskUi,
  projects: undefined,
  parent: undefined,
  taskId: {
    title: 'Task ID to update',
  },
  name: {
    title: 'The name of the task (Optional) (e.g. "My Test Task")',
  },
  assignee: {
    title:
      'The ID of the user who will be assigned to the task or "me" to assign to the current user (Optional) (e.g. "1215207682932839")',
  },
  completed: {
    title:
      'If the task is completed, enter "true" (without quotes), otherwise it will keep its previous status. (Optional)',
  },
}

export const findUserUi = {
  userEmail: {
    title: 'User Email (e.g. "mrsomebody@example.com")',
  },
}

export const addCommentToTaskUi = {
  taskId: {
    title: 'Task ID to comment',
  },
  comment: {
    title: 'Content of the comment to be added',
  },
}
