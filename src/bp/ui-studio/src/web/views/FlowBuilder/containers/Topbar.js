import { connect } from 'react-redux'
import _ from 'lodash'

import { getCurrentFlow } from '~/reducers'

import Topbar from '../topbar.jsx'

const mapStateToProps = state => ({
  flows: _.values(state.flows.flowsByName),
  currentFlow: getCurrentFlow(state)
})

const ConnectedTopbar = connect(mapStateToProps)(Topbar)

export default ConnectedTopbar
