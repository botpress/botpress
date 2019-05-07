import { connect } from 'react-redux'
import values from 'lodash/values'
import { withRouter } from 'react-router-dom'

import { getCurrentFlow, getDirtyFlows } from '~/reducers'
import { deleteFlow, duplicateFlow, renameFlow} from '~/actions'

import SidePanel from '../sidePanel'

const mapStateToProps = (state, ownProps) => ({
  currentFlow: getCurrentFlow(state),
  flows: values(state.flows.flowsByName),
  dirtyFlows: getDirtyFlows(state)
})

const mapDispatchToProps = {
  deleteFlow,
  duplicateFlow,
  renameFlow
}

const ConnectedSidePanel = connect(mapStateToProps, mapDispatchToProps)(withRouter(SidePanel))
export default ConnectedSidePanel
