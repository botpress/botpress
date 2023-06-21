import { send } from './handler'
import * as bridge from './misc/messaging/bridge'
import { Channels } from './misc/types'

export default {
  channel: {
    messages: {
      text: async (params) => {
        const { payload } = params
        await send({ ...params, message: { ...payload, type: 'text', text: payload.text, markdown: true } })
      },
      image: async (params) => {
        const { payload } = params
        await send({ ...params, message: { ...payload, type: 'image', image: payload.imageUrl } })
      },
      markdown: async (params) => {
        const { payload } = params
        await send({ ...params, message: { ...payload, type: 'text', text: payload.markdown, markdown: true } })
      },
      audio: async (params) => {
        const { payload } = params
        await send({ ...params, message: { ...payload, type: 'audio', audio: payload.audioUrl } })
      },
      video: async (params) => {
        const { payload } = params
        await send({ ...params, message: { ...payload, type: 'video', video: payload.videoUrl } })
      },
      file: async (params) => {
        const { payload } = params
        await send({ ...params, message: { ...payload, type: 'file', file: payload.fileUrl, title: payload.title } })
      },
      location: async (params) => {
        const { payload } = params
        await send({
          ...params,
          message: { ...payload, type: 'location', latitude: payload.latitude, longitude: payload.longitude },
        })
      },
      carousel: async (params) => {
        const cards = params.payload.items

        await send({
          ...params,
          message: {
            ...params.payload,
            type: 'carousel',
            items: cards.map(bridge.inputCardToMessagingCard),
          },
        })
      },
      card: async (params) => {
        const card = params.payload

        await send({
          ...params,
          message: {
            type: 'card',
            ...bridge.inputCardToMessagingCard(card),
          },
        })
      },
      dropdown: async (params) => {
        const choice = params.payload
        await send({
          ...params,
          message: {
            ...params.payload,
            type: 'dropdown',
            message: choice.text,
            options: choice.options.map((c) => ({ label: c.label, value: c.value })),
          },
        })
      },
      choice: async (params) => {
        const choice = params.payload
        await send({
          ...params,
          message: {
            ...params.payload,
            type: 'single-choice',
            text: choice.text,
            choices: choice.options.map((option) => ({
              title: option.label,
              value: option.value,
            })),
          },
        })
      },
    },
  },
} satisfies Channels
