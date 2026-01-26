import * as bp from '.botpress'

export const handleEvent: bp.WorkflowHandlers['processQueue'] = async (props) => {
  await props.workflow.setFailed({ failureReason: 'Workflow timed out' })
}
