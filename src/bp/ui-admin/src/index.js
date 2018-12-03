import React from 'react'
import ReactDOM from 'react-dom'
import { ToastContainer } from 'react-toastify'

import './index.css'
import 'react-toastify/dist/ReactToastify.css'

import { makeMainRoutes } from './routes'

const routes = makeMainRoutes()

ReactDOM.render(
  <div>
    <ToastContainer />
    {routes}
  </div>,
  document.getElementById('root')
)
