import { z } from '@bpinternal/zui'
import { Tool } from 'llmz'

/** Approval comes from the host UI, never from a model-supplied flag. */
export function createOverwriteTool(confirm: () => Promise<boolean>, overwrite: () => Promise<void>) {
  return new Tool({
    name: 'overwrite',
    description: 'Ask the user through a host confirmation dialog, then overwrite the demo data if approved.',
    output: z.object({ success: z.boolean() }),
    handler: async () => {
      if (!(await confirm())) return { success: false }
      await overwrite()
      return { success: true }
    },
  })
}
