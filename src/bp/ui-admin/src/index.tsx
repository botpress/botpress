import '@blueprintjs/core/lib/css/blueprint.css'
import 'babel-polyfill'
import 'element-closest-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'

import './index.css'
import { makeMainRoutes } from './routes'

const routes = makeMainRoutes()

ReactDOM.render(<div>{routes}</div>, document.getElementById('root'))
