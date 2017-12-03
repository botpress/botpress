import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

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
  linkFlowNodes
} from '~/actions'

import { getCurrentFlow, getCurrentFlowNode } from '~/reducers'

import Diagram from '../diagram'

const mapStateToProps = (state, ownProps) => ({
  flows: state.flows,
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state),
  currentDiagramAction: state.flows.currentDiagramAction
})

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
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
      pasteFlowNode
    },
    dispatch
  )

const ConnectedDiagram = connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(Diagram)

export default ConnectedDiagram
