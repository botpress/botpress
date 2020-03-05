import '@blueprintjs/core/lib/css/blueprint.css'
import 'babel-polyfill'
import 'element-closest-polyfill'

/* tslint:disable */
import 'expose-loader?React!react'
import 'expose-loader?ReactDOM!react-dom'
/* tslint:enable */

/*
  esnext needs the library to be used in the project otherwise it won't include it
  since ui-shared needs BlueprintJsCore, but it won't be used in the admin, we needed
  to import it and assign it to the window
*/
// @ts-ignore
import * as BlueprintJsCore from 'expose-loader?BlueprintJsCore!@blueprintjs/core'

import React from 'react'
import ReactDOM from 'react-dom'

import { initializeTranslations } from '~/translation'
import './index.css'
import { makeMainRoutes } from './routes'

const routes = makeMainRoutes()

// @ts-ignore
window.BlueprintJsCore = BlueprintJsCore

initializeTranslations().then(() => {
  ReactDOM.render(<div>{routes}</div>, document.getElementById('root'))
})
