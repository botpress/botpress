import 'babel-polyfill'
import React from 'expose-loader?React!react'
import ReactDOM from 'expose-loader?ReactDOM!react-dom'
import axios from 'axios'
import { HotKeys } from 'react-hotkeys'
import { getToken } from '~/util/Auth'
import { Provider } from 'react-redux'

import store from './store'
import { keyMap } from './keyboardShortcuts'

// Required to fix outline issue
import './style.scss'
/* eslint-disable */
import 'expose-loader?ReactSelect!react-select'
import 'expose-loader?PropTypes!prop-types'
import 'expose-loader?ReactBootstrap!react-bootstrap'
import 'expose-loader?Reactstrap!reactstrap' // TODO Remove me once we migrated to blueprint
import 'expose-loader?BotpressContentPicker!~/components/Content/Select/Widget'
import 'expose-loader?SmartInput!~/components/SmartInput'
import 'expose-loader?ElementsList!~/components/Shared/ElementsList'
import 'expose-loader?SelectActionDropdown!~/views/FlowBuilder/nodeProps/SelectActionDropdown'
import 'expose-loader?BotpressTooltip!~/components/Shared/Tooltip'
import 'expose-loader?BotpressUI!~/components/Shared/Interface'
import 'expose-loader?DocumentationProvider!~/components/Util/DocumentationProvider'
import 'expose-loader?BlueprintJsCore!@blueprintjs/core'
/* eslint-enable */

require('bootstrap/dist/css/bootstrap.css')
require('storm-react-diagrams/dist/style.min.css')
require('./theme.scss')

const token = getToken()
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token.token}`
}

// Do not use "import App from ..." as hoisting will screw up styling
const App = require('./components/App').default

ReactDOM.render(
  <Provider store={store}>
    <HotKeys keyMap={keyMap}>
      <App />
    </HotKeys>
  </Provider>,
  document.getElementById('app')
)
