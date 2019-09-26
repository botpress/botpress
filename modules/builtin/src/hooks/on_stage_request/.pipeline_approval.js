'use strict'

/**
 * Gives a short demonstration of a pipeline approval process.
 *
 * @param bp The botpress SDK
 * @param bot The complete configuration of the bot
 * @param users The list of users of that workspace (email, role)
 * @param pipeline The list of configured stages
 * @param hookResult The result of the hook which contains actions
 */
const stageChangeRequest = async () => {
const requestUser = users.find(u => u.email == bot.pipeline_status.stage_request.requested_by)

  // By default, we want to keep the bot in the current stage
  hookResult.actions = []

  // Happens if the request_user is superadmin and is not a Workspace Collaborator
  if (!requestUser) {
    return
  }

  const stageRequest = bot.pipeline_status.stage_request
  stageRequest.approvers = stageRequest.approvers || _getApprovers()
  const approvers = stageRequest.approvers

  // If the current user is an approver, mark his approval
  const matchingApprover = approvers.find(x => x.email === requestUser.email && x.strategy === requestUser.strategy)
  if (matchingApprover !== undefined) {
    matchingApprover.approved = true
  }

  // The status will be displayed in the bots list in the Workspace
  stageRequest.status = `Approvals: ${approvers.filter(x => x.approved === true).length}/${approvers.length}`

  // Save the bot
  await bp.config.mergeBotConfig(bot.id, { pipeline_status: bot.pipeline_status })

  // If all approvers have approved, move the bot to the next stage
  if (approvers.filter(x => x.approved === false).length === 0) {
    const currentStage = pipeline.find(x => x.id === bot.pipeline_status.current_stage.id)
    hookResult.actions = [currentStage.action]
  }
}

const _getApprovers = () => {
  // Either hardcode approvers like this, or call your own service to retrieve approvers
  return [
    {
      email: 'alice@acme.com',
      approved: false,
      strategy: 'default'
    },
    {
      email: 'bob@acme.com',
      approved: false,
      strategy: 'default'
    },
    {
      email: 'security@acme.com',
      approved: false,
      strategy: 'default'
    }
  ]
}

return stageChangeRequest()
