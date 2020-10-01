/**
 * Delete the provided variable from the current workflow
 *
 * @title Clear Variable
 * @category Variables
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable to clear
 */
const { name } = args
if (workflow && workflow.variables && workflow.variables[name]) {
  delete workflow.variables[name]
}
