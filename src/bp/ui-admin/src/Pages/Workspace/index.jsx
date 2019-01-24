import React from 'react'
import { MdPeople, MdAndroid, MdVerifiedUser } from 'react-icons/lib/md'

import TabLayout from '../Layouts/Tabs'
import Bots from './Bots'
import Users from './Users'
import Roles from './Roles'

const Workspace = props => {
  const title = 'Workspace'
  const tabs = [
    {
      name: 'Bots',
      icon: <MdAndroid />,
      component: <Bots />,
      res: 'admin.bots.*',
      op: 'read'
    },
    {
      name: 'Collaborators',
      icon: <MdPeople />,
      component: <Users />,
      res: 'admin.collaborators.*',
      op: 'read'
    },
    {
      name: 'Roles',
      icon: <MdVerifiedUser />,
      component: <Roles />,
      res: 'admin.roles.*',
      op: 'read'
    }
  ]

  return <TabLayout {...{ title, tabs, ...props }} />
}

export default Workspace
