import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'

import { renameFlow } from '~/actions'
import { getCurrentFlow } from '~/reducers'

import Topbar from '../topbar.jsx'

const mapStateToProps = (state, ownProps) => ({
  flows: _.values(state.flows.flowsByName),
  currentFlow: getCurrentFlow(state)
})

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      renameFlow: renameFlow
    },
    dispatch
  )

const ConnectedTopbar = connect(mapStateToProps, mapDispatchToProps)(Topbar)

export default ConnectedTopbar
