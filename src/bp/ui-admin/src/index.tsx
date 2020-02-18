import '@blueprintjs/core/lib/css/blueprint.css'
import 'babel-polyfill'
import 'element-closest-polyfill'

/* tslint:disable */
import 'expose-loader?React!react'
import 'expose-loader?ReactDOM!react-dom'
import 'expose-loader?BlueprintJsCore!@blueprintjs/core'
import 'expose-loader?BotpressShared!ui-shared'
/* tslint:enable */

import React from 'react'
import ReactDOM from 'react-dom'

import './index.css'
import { makeMainRoutes } from './routes'

const routes = makeMainRoutes()

ReactDOM.render(<div>{routes}</div>, document.getElementById('root'))
