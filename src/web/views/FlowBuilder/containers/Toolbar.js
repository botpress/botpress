import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'

import { setDiagramAction, updateFlow, flowEditorRedo, flowEditorUndo, buildNewSkill } from '~/actions'
import { getCurrentFlow, getCurrentFlowNode, getDirtyFlows, canFlowUndo, canFlowRedo } from '~/reducers'

import Toolbar from '../toolbar.jsx'

const mapStateToProps = (state, ownProps) => ({
  flowsNames: _.keys(state.flows.flowsByName),
  currentFlow: getCurrentFlow(state),
  currentDiagramAction: state.flows.currentDiagramAction,
  currentFlowNode: getCurrentFlowNode(state),
  dirtyFlows: getDirtyFlows(state),
  canUndo: canFlowUndo(state),
  canRedo: canFlowRedo(state),
  skills: state.skills.installed
})

const mapDispatchToProps = {
  setDiagramAction: setDiagramAction,
  updateFlow: updateFlow,
  undo: flowEditorUndo,
  redo: flowEditorRedo,
  buildSkill: buildNewSkill
}

const ConnectedToolbar = connect(mapStateToProps, mapDispatchToProps)(Toolbar)

export default ConnectedToolbar
