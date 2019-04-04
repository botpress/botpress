/**
 * This is called when a user requests to to promote abot to the next stage.
 * You can set the current stage of the bot to the next one
 *
 * @param bp The botpress SDK
 * @param bot The complete configuration of the bot
 * @param users The list of users of that workspace (email, role)
 * @param stages The list of configured stages
 * @param hookResult The result of the hook which contains actions
 */
const stagePromotionRequest = async () => {
  const { requested_by: requesterEmail, id: requestedStageId } = bot.pipeline_status.stage_request
  const requesterRole = users.find(user => user.email === requesterEmail)
  const stageRoles = stages.find(stage => stage.id === requestedStageId)

  // If the user is not allowed to promote the bot to the requested stage
  if (!stageRoles.includes(requesterRole)) {
    // do nothing
    hookResult.actions = []
    // Any custom logic would go here
    // For example, send an email or a notice to someone on the team who has the correct role
  }
}

return stagePromotionRequest()
