import '@blueprintjs/core/lib/css/blueprint.css'
import 'babel-polyfill'
import 'element-closest-polyfill'

/* tslint:disable */
import 'expose-loader?React!react'
import 'expose-loader?ReactDOM!react-dom'
/* tslint:enable */

// @ts-ignore
import * as BlueprintJsCore from 'expose-loader?BlueprintJsCore!@blueprintjs/core'

import React from 'react'
import ReactDOM from 'react-dom'

import './index.css'
import { makeMainRoutes } from './routes'

const routes = makeMainRoutes()

// @ts-ignore
window.BlueprintJsCore = BlueprintJsCore

ReactDOM.render(<div>{routes}</div>, document.getElementById('root'))
