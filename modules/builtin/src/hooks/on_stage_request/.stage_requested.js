/**
 * This is called when a user requests to to promote abot to the next stage.
 * You can set the current stage of the bot to the next one
 *
 * @param bp The botpress SDK
 * @param bot The complete configuration of the bot
 * @param users The list of users of that workspace (email, role)
 * @param stages The list of configured stages
 */
const stagePromotionRequest = async () => {
  const { requested_by: requesterEmail, id: requestedStageId } = bot.pipeline_status.stage_request
  const requesterRole = users.find(user => user.email === requesterEmail)
  const stageRoles = stages.find(stage => stage.id === requestedStageId)

  // If the user is allowed to promote the bot to the requested stage
  if (stageRoles.includes(requesterRole)) {
    bot.pipeline_status.current_stage = {
      promoted_by: requesterEmail,
      promoted_on: new Date(),
      id: requestedStageId
    }
  } else {
    // Any custom logic would go here if you can't send it to the next stage
    // For example, send an email or a notice to someone on the team who has the correct role
  }
}

return stagePromotionRequest()
