import React from 'react'
import ReactDOM from 'react-dom'
import { initializeTranslations } from '~/translations'

import './index.css'
import { makeMainRoutes } from './routes'

const routes = makeMainRoutes()

initializeTranslations()
ReactDOM.render(<div>{routes}</div>, document.getElementById('root'))
