import React from 'react'
import { MdAndroid, MdPeople, MdVerifiedUser } from 'react-icons/md'

import TabLayout, { AdminTab } from '../Layouts/Tabs'

import Bots from './Bots'
import Roles from './Roles'
import Users from './Users'

const Workspace = props => {
  const title = 'Workspace'
  const tabs: AdminTab[] = [
    {
      id: 'tab-bots',
      name: 'Bots',
      route: '/workspace/bots',
      icon: <MdAndroid />,
      component: Bots,
      res: 'admin.bots.*',
      op: 'read',
      size: 11
    },
    {
      id: 'tab-collaborators',
      name: 'Collaborators',
      route: '/workspace/users',
      icon: <MdPeople />,
      component: Users,
      res: 'admin.collaborators.*',
      op: 'read',
      proOnly: true
    },
    {
      id: 'tab-roles',
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
