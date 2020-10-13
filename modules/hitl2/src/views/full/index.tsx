import React from 'react'
import { Store } from './Store'
import Sidebar from './Sidebar'
import App from './App'

export default ({ bp }) => {
  return (
    <Store>
      <App bp={bp} />
    </Store>
  )
}

export { Sidebar }
