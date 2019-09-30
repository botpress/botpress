/**
 * This is called when a user requests to to promote a bot to the next stage.
 * You can set the current stage of the bot to the next one
 *
 * @param bp The botpress SDK
 * @param bot The complete configuration of the bot
 * @param users The list of users of that workspace (email, role)
 * @param pipeline The list of configured stages
 * @param hookResult The result of the hook which contains actions
 */
const stageChangeRequest = async () => {
  const request_user = users.find(u => u.email == bot.pipeline_status.stage_request.requested_by)
  if (!request_user || request_user.role !== 'admin.*') {
    /*
    we want to keep the bot in the current stage and until another user with the right role promotes it
    here would go an api call to your 3rd party notification service
    */
    hookResult.actions = []
    return
  }
}

return stageChangeRequest()
