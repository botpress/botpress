import type { Channels } from '../misc/types'

class NotImplementedError extends Error {
  constructor() {
    super('Not implemented')
  }
}

export const channels: Channels = {
  channel: {
    messages: {
      text: async () => {
        throw new NotImplementedError()
      },
      image: async () => {
        throw new NotImplementedError()
      },
      markdown: async () => {
        throw new NotImplementedError()
      },
      audio: async () => {
        throw new NotImplementedError()
      },
      video: async () => {
        throw new NotImplementedError()
      },
      file: async () => {
        throw new NotImplementedError()
      },
      location: async () => {
        throw new NotImplementedError()
      },
      carousel: async () => {
        throw new NotImplementedError()
      },
      card: async () => {
        throw new NotImplementedError()
      },
      choice: async () => {
        throw new NotImplementedError()
      },
      dropdown: async () => {
        throw new NotImplementedError()
      },
    },
  },
}
