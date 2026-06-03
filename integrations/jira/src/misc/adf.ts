import type { Version3Models } from 'jira.js'

export const textToAdfDocument = (text: string): Version3Models.Document => {
  if (!text) {
    return { version: 1, type: 'doc', content: [] }
  }
  return {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text }],
      },
    ],
  }
}
