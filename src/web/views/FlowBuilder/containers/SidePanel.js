import { connect } from 'react-redux'
import values from 'lodash/values'

import { getCurrentFlow, getCurrentFlowNode, getDirtyFlows } from '~/reducers'
import {
  updateFlowNode,
  updateFlow,
  removeFlowNode,
  switchFlow,
  deleteFlow,
  duplicateFlow,
  requestEditSkill
} from '~/actions'

import SidePanel from '../sidePanel'

const mapStateToProps = (state, ownProps) => ({
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state),
  flows: values(state.flows.flowsByName),
  dirtyFlows: getDirtyFlows(state)
})

const mapDispatchToProps = { updateFlowNode, updateFlow, switchFlow, deleteFlow, duplicateFlow, requestEditSkill }

const ConnectedSidePanel = connect(mapStateToProps, mapDispatchToProps)(SidePanel)
export default ConnectedSidePanel
