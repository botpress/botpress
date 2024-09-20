import { RuntimeError } from '@botpress/client'
import { createComment, getCardContent } from './misc/utils'
import * as bp from '.botpress'

export default {
  issue: {
    messages: {
      text: ({ payload, ...props }) => createComment({ ...props, content: payload.text }),
      image: ({ payload, ...props }) => createComment({ ...props, content: payload.imageUrl }),
      markdown: ({ payload, ...props }) => createComment({ ...props, content: payload.markdown }),
      audio: ({ payload, ...props }) => createComment({ ...props, content: payload.audioUrl }),
      video: ({ payload, ...props }) => createComment({ ...props, content: payload.videoUrl }),
      file: ({ payload, ...props }) => createComment({ ...props, content: payload.fileUrl }),
      location: ({ payload, ...props }) =>
        createComment({ ...props, content: `${payload.latitude},${payload.longitude}` }),
      card: ({ payload, ...props }) => createComment({ ...props, content: getCardContent(payload) }),
      carousel: async ({ payload, ...props }) => {
        await Promise.all(payload.items.map((item) => createComment({ ...props, content: getCardContent(item) })))
      },
      dropdown: ({ payload, ...props }) => createComment({ ...props, content: payload.text }),
      choice: ({ payload, ...props }) => createComment({ ...props, content: payload.text }),
      bloc: () => {
        throw new RuntimeError('Not implemented')
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
