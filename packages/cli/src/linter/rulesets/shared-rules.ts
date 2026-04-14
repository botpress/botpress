import { RuleDefinition } from '@stoplight/spectral-core'
import { truthyWithMessage } from '../spectral-functions'

export const secretsMustHaveADescription: RuleDefinition = {
  description: 'All secrets {{callToAction}} have a description',
  message: '{{description}}: {{error}} {{callToAction}} have a non-empty description',
  severity: 'error',
  given: '$.secrets[*]',
  then: [
    {
      field: 'description',
      function: truthyWithMessage(({ path }) => `secret "${path[1]}"`),
    },
  ],
}
