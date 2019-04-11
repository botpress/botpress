'use strict'

/**
 * This is called when the bot is on a new stage.
 *
 * @param bp The botpress SDK
 * @param previousBotConfig The complete configuration of the bot before stage change request
 * @param bot The complete configuration of the bot
 * @param users The list of users of that workspace (email, role)
 * @param stages The list of configured stages
 */
const stageChanged = async () => {
  // Any custom logic would go here
  // For example, send an email to the person who requested the stage change
  if (!previousBotConfig.pipeline_status.stage_request) {
    return
  }
  const { requested_by: requesterEmail } = previousBotConfig.pipeline_status.stage_request
  const { promoted_by, id: newStage } = bot.pipeline_status.current_stage
  if (requesterEmail && promoted_by !== requesterEmail) {
    // Send the email here
    console.log(`Your bot ${bot.id} was promoted to stage ${newStage} by ${promoted_by}`)
  }
}

return stageChanged()
