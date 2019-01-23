import React from 'react'

import TabLayout from './Layouts/Tabs'
import Bots from './Bots'
import Users from './Users'
import Roles from './Roles'
import { MdPeople, MdAndroid, MdVerifiedUser } from 'react-icons/lib/md'

const Workspace = props => {
  const title = 'Workspace'
  const tabs = [
    { name: 'Bots', icon: <MdAndroid />, component: <Bots /> },
    { name: 'Collaborators', icon: <MdPeople />, component: <Users /> },
    { name: 'Roles', icon: <MdVerifiedUser />, component: <Roles /> }
  ]

  return <TabLayout {...{ title, tabs, ...props }} />
}

export default Workspace
