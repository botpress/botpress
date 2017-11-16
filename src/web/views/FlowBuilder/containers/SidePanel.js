import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { updateFlowNode, updateFlow, removeFlowNode } from '~/actions'
import { getCurrentFlow, getCurrentFlowNode } from '~/reducers'

import SidePanel from '../sidePanel'

const mapStateToProps = (state, ownProps) => ({
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state)
})

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      updateFlowNode: updateFlowNode,
      updateFlow: updateFlow,
      removeFlowNode: removeFlowNode
    },
    dispatch
  )

const ConnectedSidePanel = connect(mapStateToProps, mapDispatchToProps)(SidePanel)

export default ConnectedSidePanel
