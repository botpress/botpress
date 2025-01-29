import { z } from '@botpress/sdk'

// documentation for Section: https://developer.todoist.com/rest/v2/#sections

export namespace Section {
  const _fields = {
    id: z.string().title('ID').describe('The ID of the section.'),
    name: z.string().title('Name').describe('The name of the section.'),
    projectId: z.string().title('Project ID').optional().describe('The ID of the project this section belongs to.'),
    positionWithinParent: z
      .number()
      .title('Position Within Parent')
      .describe("Numerical index indicating section's order within its parent project."),
  } as const

  export const schema = z.object(_fields)
  export type InferredType = z.infer<typeof schema>
}
