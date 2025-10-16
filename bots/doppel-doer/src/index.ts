import * as bp from '.botpress'

const bot = new bp.Bot({ actions: {} })

bot.on.afterIncomingEvent('todoist-src:taskAdded', async (props) => {
  props.logger.info(`Copying task "${props.data.payload.content}" from todoist-src to todoist-dst...`)

  const newTask = await props.client.callAction({
    type: 'todoist-dst:createNewTask',
    input: {
      content: props.data.payload.content,
      description: props.data.payload.description,
      priority: props.data.payload.priority,
    },
  })

  const newTaskId = newTask.output.taskId

  props.logger.info(`Created new task in todoist-dst with ID ${newTaskId}`)

  return {}
})

export default bot
