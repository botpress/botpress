import { Api } from './api'
import { bot } from './bot'
import { markdown } from './markdown'

const STEAK = 'https://upload.wikimedia.org/wikipedia/commons/9/91/T-bone-raw-MCB.jpg'
const LIZST = 'https://vmirror.imslp.org/files/imglnks/usimg/5/5c/IMSLP301563-PMLP02598-upload.mp3'

bot.on.event('*', async (args) => {
  console.info('received event', {
    conversationId: args.event.conversationId,
    userId: args.event.userId,
  })

  if (args.event.type === 'chat:custom') {
    console.info('custom event received', args.event.payload)
    await args.client.callAction({
      type: 'chat:sendEvent',
      input: args.event.payload,
    })
  }
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

bot.on.message('*', async (args) => {
  console.info('received message', args.message)

  const api = Api.from(args)
  if (args.message.type !== 'text') {
    await api.respond({ type: 'text', text: 'I only understand text messages' })
    return
  }

  const text = args.message.payload.text.toLowerCase()
  switch (text) {
    case 'text':
      await api.respond({ type: 'text', text: 'Hello, world!' })
      break

    case 'markdown':
      await api.respond({
        type: 'markdown',
        markdown,
      })
      break
    case 'image':
      await api.respond({
        type: 'image',
        imageUrl: STEAK,
      })
      break
    case 'location':
      await api.respond({
        type: 'location',
        latitude: 40.748817,
        longitude: -73.985428,
      })
      break
    case 'pdf':
      await api.respond({
        type: 'file',
        fileUrl: 'https://cdn.botpress.dev/test.pdf',
      })
      break
    case 'file':
      await api.respond({
        type: 'file',
        fileUrl: 'https://spg-test-public-files.s3.amazonaws.com/cities.csv',
      })
      break
    case 'video':
      await api.respond({
        type: 'video',
        videoUrl: 'https://spg-test-public-files.s3.us-east-1.amazonaws.com/sample-mp4-file-small.mp4',
      })
      break
    case 'audio':
      await api.respond({
        type: 'audio',
        audioUrl: LIZST,
      })
      break
    case 'choice':
      await api.respond({
        type: 'choice',
        text: 'Choose an option',
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
          { label: 'Option 3', value: 'option3' },
        ],
      })
      break
    case 'dropdown':
      await api.respond({
        type: 'dropdown',
        text: 'Choose an option',
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
          { label: 'Option 3', value: 'option3' },
          { label: 'Option 4', value: 'option4' },
          { label: 'Option 5', value: 'option5' },
          { label: 'Option 6', value: 'option6' },
          { label: 'Option 7', value: 'option7' },
          { label: 'Option 8', value: 'option8' },
        ],
      })
      break
    case 'card':
      await api.respond({
        type: 'card',
        title: 'title',
        subtitle: 'subtitle',
        imageUrl: STEAK,
        actions: [
          { action: 'url', label: 'label1', value: 'https://google.com' },
          { action: 'say', label: 'label2', value: 'text' },
        ],
      })
      break
    case 'carousel':
      await api.respond({
        type: 'carousel',
        items: [
          {
            title: 'title 1',
            subtitle: 'subtitle 1',
            actions: [
              {
                action: 'url',
                label: 'label 1',
                value: 'https://google.com',
              },
            ],
            imageUrl: STEAK,
          },
          {
            title: 'title 2',
            subtitle: 'subtitle 2',
            actions: [
              {
                action: 'say',
                label: 'label 2',
                value: 'text 2',
              },
            ],
            imageUrl: 'https://miro.medium.com/v2/resize:fit:800/1*gGzjds6d329U8umqHI0nKQ.jpeg',
          },
        ],
      })
      break
    case 'link':
      await api.respond({
        type: 'text',
        text: '[Click here](https://google.com) to go to Google',
      })
      break
    case 'empty_choice':
      await api.respond({
        type: 'choice',
        text: 'Choose an option',
        options: [],
      })
      break
    case 'empty_card':
      await api.respond({
        type: 'card',
        title: 'title',
        subtitle: 'subtitle',
        actions: [],
      })
      break
    case 'bloc':
      await api.respond({
        type: 'bloc',
        items: [
          {
            type: 'text',
            payload: { text: 'Hello, world!' },
          },
          {
            type: 'image',
            payload: { imageUrl: STEAK },
          },
          {
            type: 'audio',
            payload: { audioUrl: LIZST },
          },
        ],
      })
      break
    case 'loop':
      for (let i = 0; i < 20; i++) {
        await sleep(1000)
        await api.respond({ type: 'text', text: `Message ${i}` })
      }
      break
    case 'metadata':
      const { payload } = args.message
      const metadata = 'metadata' in payload ? payload.metadata : {}
      await api.respond({ type: 'text', text: 'metadata', metadata })
      break
    default:
      const { name } = args.user
      const hiMsg = name ? `Hi, ${name}` : 'Hi'
      await api.respond({ type: 'text', text: `${hiMsg}! You said: "${text}"` })
      break
  }
})

export default bot
