import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { fetchFlows, setDiagramAction, updateFlow } from '~/actions'
import { getCurrentFlow, getCurrentFlowNode, getDirtyFlows } from '~/reducers'

import Toolbar from '../toolbar.jsx'

const mapStateToProps = (state, ownProps) => ({
  flowsNames: _.keys(state.flows.flowsByName),
  currentFlow: getCurrentFlow(state),
  currentDiagramAction: state.flows.currentDiagramAction,
  currentFlowNode: getCurrentFlowNode(state),
  dirtyFlows: getDirtyFlows(state)
})

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      fetchFlows: fetchFlows,
      setDiagramAction: setDiagramAction,
      updateFlow: updateFlow
    },
    dispatch
  )

const ConnectedToolbar = connect(mapStateToProps, mapDispatchToProps)(Toolbar)

export default ConnectedToolbar
