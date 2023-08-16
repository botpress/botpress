export const findUserUi = {
  accountId: {
    title: 'A Account ID',
  },
}

export const newIssueUi = {
  summary: {
    title:
      'The summary of the issue, providing a brief description (e.g. My Issue)',
  },
  description: {
    title:
      'The detailed description of the issue (Optional) (e.g. This is an example issue for demonstration purposes)',
  },
  issueType: {
    title:
      'The type of the issue (e.g. "Bug", "Task", "Subtask", "Story" or "Epic")',
    examples: ['Bug', 'Task', 'Story', 'Subtask', 'Epic'],
  },
  projectKey: {
    title: 'The key of the project to which the issue belongs (e.g. TEST)',
  },
  parentKey: {
    title:
      'The key of the parent issue, if this issue is a sub-task (Optional) (e.g. TEST-1)',
  },
  assigneeId: {
    title:
      'The ID of the user to whom the issue is assigned (Optional) (e.g. 5b10ac8d82e05b22cc7d4ef5)',
  },
}

export const updateIssueUi = {
  issueKey: {
    title: 'The Key for Issue (Required) (e.g. TASK-185)',
  },
  summary: {
    title:
      'The summary of the issue, providing a brief description (Optional) (e.g. My Issue)',
  },
  description: {
    title:
      'The detailed description of the issue (Optional) (e.g. This is an example issue for demonstration purposes)',
  },
  issueType: {
    title:
      'The type of the issue (Required) (e.g. "Bug", "Task", "Subtask", "Story" or "Epic")',
    examples: ['Bug', 'Task', 'Story', 'Subtask', 'Epic'],
  },
  projectKey: {
    title:
      'The key of the project to which the issue belongs (Optional) (e.g. TEST)',
  },
  parentKey: {
    title:
      'The key of the parent issue, if this issue is a sub-task (Optional) (e.g. TEST-1)',
  },
  assigneeId: {
    title:
      'The ID of the user to whom the issue is assigned (Optional) (e.g. 5b10ac8d82e05b22cc7d4ef5)',
  },
}

export const addCommentToIssueUi = {
  issueKey: {
    title: 'The Key for Issue (Required) (e.g. TASK-185)',
  },
  body: {
    title: 'Message content in text format',
  },
}

export const findAllUsersUi = {
  startAt: {
    title: 'The index of the first item to return (Default: 0) (Optional)',
  },
  maxResults: {
    title:
      ' The maximum number of items to return per page (Default: 50) (Optional)',
  },
}
