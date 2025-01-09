import { z } from '@botpress/sdk'

// documentation for Label: https://developer.todoist.com/rest/v2/#labels

/**
 * Shared labels are ephemeral in nature. They only exist as long as at least
 * one task is associated with them. Once all tasks are removed from a shared
 * label, the label ceases to exist.
 *
 * A user can convert a shared label to a personal label at any time. The label
 * will then become customizable and will remain in the account even if not
 * assigned to any active tasks.
 *
 * Likewise, a personal label can be converted to a shared label by the user if
 * they no longer require them to be stored against their account, but they
 * still appear on shared tasks.
 */
export namespace SharedLabel {
  const _fields = {
    name: z.string().title('Name').describe('The name of the label.'),
  } as const

  export const schema = z.object(_fields)
  export type InferredType = z.infer<typeof schema>
}
