import React from 'react'
import { MdPeople, MdAndroid, MdVerifiedUser } from 'react-icons/md'

import TabLayout from '../Layouts/Tabs'
import Bots from './Bots'
import Users from './Users'
import Roles from './Roles'

const Workspace = props => {
  const title = 'Workspace'
  const tabs = [
    {
      name: 'Bots',
      route: '/workspace/bots',
      icon: <MdAndroid />,
      component: Bots,
      res: 'admin.bots.*',
      op: 'read',
      size: 11
    },
    {
      name: 'Collaborators',
      route: '/workspace/users',
      icon: <MdPeople />,
      component: Users,
      res: 'admin.collaborators.*',
      op: 'read',
      proOnly: true
    },
    {
      name: 'Roles',
      route: '/workspace/roles',
      icon: <MdVerifiedUser />,
      component: Roles,
      res: 'admin.roles.*',
      op: 'read',
      proOnly: true
    }
  ]

  return <TabLayout {...{ title, tabs, ...props }} />
}

export default Workspace
