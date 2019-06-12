import _ from 'lodash'
import { connect } from 'react-redux'

import { buildNewSkill, flowEditorRedo, flowEditorUndo, setDiagramAction, updateFlow } from '~/actions'
import { canFlowRedo, canFlowUndo, getCurrentFlow, getCurrentFlowNode, getDirtyFlows } from '~/reducers'

import Toolbar from '../toolbar'

const mapStateToProps = state => ({
  flowsNames: _.keys(state.flows.flowsByName),
  currentFlow: getCurrentFlow(state),
  currentDiagramAction: state.flows.currentDiagramAction,
  currentFlowNode: getCurrentFlowNode(state),
  dirtyFlows: getDirtyFlows(state),
  canUndo: canFlowUndo(state),
  canRedo: canFlowRedo(state),
  canPasteNode: Boolean(state.flows.nodeInBuffer),
  skills: state.skills.installed,
  user: state.user
})

const mapDispatchToProps = {
  setDiagramAction: setDiagramAction,
  updateFlow: updateFlow,
  undo: flowEditorUndo,
  redo: flowEditorRedo,
  buildSkill: buildNewSkill
}

const ConnectedToolbar = connect(
  mapStateToProps,
  mapDispatchToProps
)(Toolbar)

export default ConnectedToolbar
