import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { updateFlowNode, updateFlow, removeFlowNode, switchFlow } from '~/actions'
import { getCurrentFlow, getCurrentFlowNode, getDirtyFlows } from '~/reducers'

import _ from 'lodash'

import SidePanel from '../sidePanel'

const mapStateToProps = (state, ownProps) => ({
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state),
  flows: _.values(state.flows.flowsByName),
  dirtyFlows: getDirtyFlows(state)
})

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      updateFlowNode: updateFlowNode,
      updateFlow: updateFlow,
      switchFlow: switchFlow
    },
    dispatch
  )

const ConnectedSidePanel = connect(mapStateToProps, mapDispatchToProps)(SidePanel)

export default ConnectedSidePanel
