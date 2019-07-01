import values from 'lodash/values'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { deleteFlow, duplicateFlow, renameFlow } from '~/actions'
import { getCurrentFlow, getDirtyFlows } from '~/reducers'

import SidePanel from '../sidePanel'

const mapStateToProps = (state, ownProps) => ({
  currentFlow: getCurrentFlow(state),
  flows: values(state.flows.flowsByName),
  dirtyFlows: getDirtyFlows(state),
  flowProblems: state.flows.flowProblems
})

const mapDispatchToProps = {
  deleteFlow,
  duplicateFlow,
  renameFlow
}

const ConnectedSidePanel = connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(SidePanel))
export default ConnectedSidePanel
