import 'babel-polyfill'
import 'element-closest-polyfill'
import 'ui-shared/dist/theme.css'

import React from 'react'
import ReactDOM from 'react-dom'

import { makeMainRoutes } from '~/app/routes'
import { initializeTranslations } from '~/app/translations'
import '~/app/style/index.css'

const routes = makeMainRoutes()

initializeTranslations()
ReactDOM.render(<div>{routes}</div>, document.getElementById('root'))
