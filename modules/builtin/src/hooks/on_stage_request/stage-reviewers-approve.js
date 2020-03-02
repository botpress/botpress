const stage = pipeline.find(x => x.id === bot.pipeline_status.current_stage.id)

if (stage.reviewers && stage.reviewers.length > 0) {
  const request = bot.pipeline_status.stage_request
  if (request && request.approvals) {
    let intersection = stage.reviewers.filter(x => request.approvals.includes(x))
    if (intersection.length >= stage.minimumApprovals) {
      return
    }
  }
  hookResult.actions = []
}
