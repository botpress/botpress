import React from 'react'

import TabLayout from './Layouts/Tabs'
import Bots from './Bots'
import Users from './Users'
import Roles from './Roles'

const Workspace = () => {
  const title = 'Workspace'
  const tabs = [
    { name: 'Bots', component: <Bots /> },
    { name: 'Collaborators', component: <Users /> },
    { name: 'Roles', component: <Roles /> }
  ]

  return <TabLayout {...{ title, tabs }} />
}

export default Workspace
