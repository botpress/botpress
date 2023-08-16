import {
  findUserInputSchema,
  findUserOutputSchema,
  newIssueInputSchema,
  newIssueOutputSchema,
  updateIssueInputSchema,
  updateIssueOutputSchema,
  addCommentToIssueInputSchema,
  addCommentToIssueOutputSchema,
  findAllUsersInputSchema,
  findAllUsersOutputSchema,
} from '../misc/custom-schemas'
import {
  findUserUi,
  newIssueUi,
  updateIssueUi,
  addCommentToIssueUi,
  findAllUsersUi,
} from '../misc/custom-uis'

const findUser = {
  title: 'Find User',
  description: 'Find user by Account ID',
  input: {
    schema: findUserInputSchema,
    ui: findUserUi,
  },
  output: {
    schema: findUserOutputSchema,
  },
}

const newIssue = {
  title: 'New Issue',
  description: 'Create a new issue in Jira',
  input: {
    schema: newIssueInputSchema,
    ui: newIssueUi,
  },
  output: {
    schema: newIssueOutputSchema,
  },
}

const updateIssue = {
  title: 'Update Issue',
  description: 'Update a issue in Jira',
  input: {
    schema: updateIssueInputSchema,
    ui: updateIssueUi,
  },
  output: {
    schema: updateIssueOutputSchema,
  },
}

const addCommentToIssue = {
  title: 'Add Comment To Issue',
  description: 'Add comment to issue in Jira',
  input: {
    schema: addCommentToIssueInputSchema,
    ui: addCommentToIssueUi,
  },
  output: {
    schema: addCommentToIssueOutputSchema,
  },
}

const findAllUsers = {
  title: 'Find All Users',
  description: 'Find All Users',
  input: {
    schema: findAllUsersInputSchema,
    ui: findAllUsersUi,
  },
  output: {
    schema: findAllUsersOutputSchema,
  },
}

export const actions = {
  findUser,
  newIssue,
  updateIssue,
  addCommentToIssue,
  findAllUsers,
}
