import { connect } from 'react-redux'

import { getCurrentFlow, getCurrentFlowNode } from '~/reducers'
import {
  fetchFlows,
  switchFlowNode,
  setDiagramAction,
  createFlowNode,
  saveAllFlows,
  updateFlowNode,
  removeFlowNode,
  copyFlowNode,
  pasteFlowNode,
  createFlow,
  updateFlow,
  linkFlowNodes,
  insertNewSkillNode
} from '~/actions'

import Diagram from '../diagram'

const mapStateToProps = state => ({
  flows: state.flows,
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state),
  currentDiagramAction: state.flows.currentDiagramAction
})

const mapDispatchToProps = {
  fetchFlows,
  switchFlowNode,
  setDiagramAction,
  createFlowNode,
  saveAllFlows,
  removeFlowNode,
  createFlow,
  updateFlowNode,
  updateFlow,
  linkFlowNodes,
  copyFlowNode,
  pasteFlowNode,
  insertNewSkillNode
}

const ConnectedDiagram = connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(Diagram)
export default ConnectedDiagram
