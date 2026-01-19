import { deleteIssue } from './delete-issue'
import * as bp from '.botpress'

export const issueDelete: bp.IntegrationProps['actions']['issueDelete'] = async (args) => {
  return deleteIssue({
    ...args,
    type: 'deleteIssue',
    input: { id: args.input.id },
  })
}
