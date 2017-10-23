import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { fetchFlows, switchFlowNode, setDiagramAction, createFlowNode } from '~/actions'
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
      fetchFlows: fetchFlows,
      switchFlowNode: switchFlowNode,
      setDiagramAction: setDiagramAction,
      createFlowNode: createFlowNode
    },
    dispatch
  )

const ConnectedDiagram = connect(mapStateToProps, mapDispatchToProps)(Diagram)

export default ConnectedDiagram
