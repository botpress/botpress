const axios = require('axios')

async function execute() {
  const redirectAction = event.ndu.actions.find(x => x.action === 'redirect')

  const { goalSuccess, currentGoalId } = event.state.session

  const obj = {
    text: event.preview,
    target: event.target,
    currentGoal: event.state.context.currentFlow,
    currentGoalId,
    nextGoal: redirectAction && redirectAction.data.flow,
    triggers: event.ndu.triggers,
    // actions: event.ndu.actions,
    result: goalSuccess
  }

  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
  await axios.post('/mod/ndu/logEvent', obj, axiosConfig)

  await event.state.session.lastGoals
    .filter(x => x.ended)
    .forEach(async goal => {
      // Update feedback for event
      delete goal.ended
      delete goal.success
    })
}

return execute()
