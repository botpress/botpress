import React from 'react'
import { Store } from './app/Store'
import Sidebar from './Sidebar'
import AgentStatus from './AgentStatus'
import App from './App'

export default ({ bp }) => {
  return (
    <Store>
      <App bp={bp} />
    </Store>
  )
}

export { AgentStatus, Sidebar }
