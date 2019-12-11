import '@blueprintjs/core/lib/css/blueprint.css'
import 'element-closest-polyfill'
import 'es6-shim'
import 'es6-symbol/implement'
import 'polyfill-array-includes'
import React from 'react'
import ReactDOM from 'react-dom'

import './index.css'
import { makeMainRoutes } from './routes'

const routes = makeMainRoutes()

ReactDOM.render(<div>{routes}</div>, document.getElementById('root'))
