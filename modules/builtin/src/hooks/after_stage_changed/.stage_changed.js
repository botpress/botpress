/**
 * This is called when the bot is on a new stage.
 *
 * @param bp The botpress SDK
 * @param bot The complete configuration of the bot
 * @param users The list of users of that workspace (email, role)
 * @param stages The list of configured stages
 */
const stageChanged = async () => {
  const { requested_by: requesterEmail } = bot.pipeline_status.stage_request
  const { promoted_by, id: newStage } = bot.pipeline_status.current_stage

  // You can, for example, send an email to the user who requested the change
  if (promoted_by !== requesterEmail) {
    console.log(`Your bot ${bot.id} was promoted to stage ${newStage} by ${promoted_by}`)
  }
}

return stageChanged()
