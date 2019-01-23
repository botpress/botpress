import React from 'react'
import { MdPeople, MdAndroid, MdVerifiedUser } from 'react-icons/lib/md'

import TabLayout from '../Layouts/Tabs'
import Bots from './Bots'
import Users from './Users'
import Roles from './Roles'

const Workspace = props => {
  const title = 'Workspace'
  const tabs = [
    { name: 'Bots', icon: <MdAndroid />, component: <Bots />, resource: 'admin.bots.*', operation: 'read' },
    {
      name: 'Collaborators',
      icon: <MdPeople />,
      component: <Users />,
      resource: 'admin.collaborators.*',
      operation: 'read'
    },
    { name: 'Roles', icon: <MdVerifiedUser />, component: <Roles />, resource: 'admin.roles.*', operation: 'read' }
  ]

  return <TabLayout {...{ title, tabs, ...props }} />
}

export default Workspace
