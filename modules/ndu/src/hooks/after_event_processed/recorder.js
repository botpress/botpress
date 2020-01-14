const axios = require('axios')

async function execute() {
  const redirectAction = event.ndu.actions.find(x => x.action === 'redirect')

  const { nduResult, currentGoalId } = event.state.session

  const obj = {
    text: event.preview,
    target: event.target,
    currentGoal: event.state.context.currentFlow,
    currentGoalId,
    nextGoal: redirectAction && redirectAction.data.flow,
    triggers: event.ndu.triggers,
    // actions: event.ndu.actions,
    result: nduResult
  }

  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
  await axios.post('/mod/ndu/logEvent', obj, axiosConfig)

  if (nduResult) {
    delete event.state.session.nduResult
    delete event.state.session.currentGoalId
  }
}

return execute()
