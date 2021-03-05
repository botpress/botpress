import 'babel-polyfill'
import 'element-closest-polyfill'
import 'ui-shared/dist/theme.css'

/* eslint-disable */
import 'expose-loader?React!react'
import 'expose-loader?ReactDOM!react-dom'
/* eslint-enable */

/*
  esnext needs the library to be used in the project otherwise it won't include it
  since ui-shared needs BlueprintJsCore, but it won't be used in the admin, we needed
  to import it and assign it to the window
*/
// @ts-ignore
import * as BlueprintJsCore from 'expose-loader?BlueprintJsCore!@blueprintjs/core'
// @ts-ignore
import * as BlueprintJsSelect from 'expose-loader?BlueprintJsSelect!@blueprintjs/select'

import React from 'react'
import ReactDOM from 'react-dom'

import { makeMainRoutes } from '~/app/routes'
import { initializeTranslations } from '~/app/translations'
import '~/app/style/index.css'

const routes = makeMainRoutes()

window['BlueprintJsCore'] = BlueprintJsCore
window['BlueprintJsSelect'] = BlueprintJsSelect

initializeTranslations()
ReactDOM.render(<div>{routes}</div>, document.getElementById('root'))
