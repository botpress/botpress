import { describe, expect, it } from 'vitest'
import { RuntimeError } from '@botpress/sdk'

import { buildIssueRuntimeError, getJiraErrorDetail, textToAdfDocument } from './index'

describe('Jira utility helpers', () => {
  it('wraps plain text in a minimal Jira ADF document', () => {
    expect(textToAdfDocument('Please investigate this.')).toEqual({
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Please investigate this.' }],
        },
      ],
    })
  })

  it('extracts detail from Jira error messages and field errors', () => {
    expect(
      getJiraErrorDetail({
        errorMessages: ['The request is invalid'],
        errors: { issuetype: 'Issue type is invalid' },
      })
    ).toBe('The request is invalid; issuetype: Issue type is invalid')
  })

  it('does not treat normal Error objects as Jira error details', () => {
    expect(getJiraErrorDetail(new Error('network failed'))).toBeUndefined()
  })

  it('does not treat non-object unknown values as Jira error details', () => {
    expect(getJiraErrorDetail('network failed')).toBeUndefined()
  })

  it('builds issue runtime errors from guarded Jira error details', () => {
    const error = buildIssueRuntimeError({ errorMessages: ['Field description is invalid'] }, 'Task', 'SCRUM', 'create')

    expect(error).toBeInstanceOf(RuntimeError)
    expect(error.message).toBe('Failed to create issue: Field description is invalid')
  })
})
