import { connect } from 'react-redux'
import {
  buildNewSkill,
  copyFlowNode,
  createFlow,
  createFlowNode,
  fetchFlows,
  insertNewSkillNode,
  openFlowNodeProps,
  pasteFlowNode,
  removeFlowNode,
  setDiagramAction,
  switchFlow,
  switchFlowNode,
  updateFlow,
  updateFlowNode,
  updateFlowProblems
} from '~/actions'
import { getCurrentFlow, getCurrentFlowNode } from '~/reducers'

import Diagram from '../diagram'

const mapStateToProps = state => ({
  flows: state.flows,
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state),
  currentDiagramAction: state.flows.currentDiagramAction,
  canPasteNode: Boolean(state.flows.nodeInBuffer)
})

const mapDispatchToProps = {
  fetchFlows,
  switchFlowNode,
  openFlowNodeProps,
  setDiagramAction,
  createFlowNode,
  removeFlowNode,
  createFlow,
  updateFlowNode,
  switchFlow,
  updateFlow,
  copyFlowNode,
  pasteFlowNode,
  insertNewSkillNode,
  updateFlowProblems,
  buildSkill: buildNewSkill
}

const ConnectedDiagram = connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  { withRef: true }
)(Diagram)
export default ConnectedDiagram
