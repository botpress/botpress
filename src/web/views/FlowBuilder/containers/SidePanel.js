import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import {
  updateFlowNode,
  updateFlow,
  removeFlowNode,
  switchFlow,
  deleteFlow,
  duplicateFlow,
  requestEditSkill
} from '~/actions'
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
  bindActionCreators({ updateFlowNode, updateFlow, switchFlow, deleteFlow, duplicateFlow, requestEditSkill }, dispatch)

const ConnectedSidePanel = connect(mapStateToProps, mapDispatchToProps)(SidePanel)

export default ConnectedSidePanel
