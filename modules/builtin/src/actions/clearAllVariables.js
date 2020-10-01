/**
 * Clear all variables of the current workflow
 *
 * @title Clear All Variables
 * @category Variables
 * @author Botpress, Inc.
 */
if (workflow && workflow.variables) {
  Object.keys(workflow.variables).forEach(wf => {
    delete workflow.variables[wf]
  })
}
