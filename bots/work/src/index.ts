import * as bp from '.botpress'
import { Client } from '@botpress/client'
import { AbortError } from '@bpinternal/workflow/src/error'
import { basicFlow, processFile } from './workflows'

const bot = new bp.Bot({
  actions: {
    start: async ({ client }) => {
      const w = await basicFlow.start({ client: client as any, input: {} })

      return {
        workflowId: w.id,
      }
    },
  },
})

const handler = bot.handler

const handleWorkflowUpdate = async (props: any) => {
  const botId = props.headers['x-bot-id']
  const { body } = props
  const client = new Client({ botId }) as any

  const data = JSON.parse(body)
  const event = data.event

  if (event.payload.workflow.name === 'basic') {
    await basicFlow.run({ client, event, input: event.payload.workflow.input })
  }

  if (event.payload.workflow.name === 'processFile') {
    await processFile.run({ client, event, input: event.payload.workflow.input })
  }
}

;(bot.handler as any) = async (props: any) => {
  const operation = props.headers['x-bp-operation']
  const type = props.headers['x-bp-type']

  if (operation !== 'event_received') {
    return handler(props)
  }

  if (type === 'workflow_update') {
    return handleWorkflowUpdate(props).catch((e) => {
      if (e instanceof AbortError) {
        return
      }

      throw e
    })
  }

  return handler(props)
}

export default bot
