import React, { useEffect } from 'react'
import { MdAndroid, MdPeople, MdVerifiedUser } from 'react-icons/md'
import { generatePath, matchPath } from 'react-router'
import { getActiveWorkspace } from '~/Auth'

import WorkspaceSelect from '../Components/WorkspaceSelect'
import TabLayout, { AdminTab } from '../Layouts/Tabs'

import Bots from './Bots'
import Roles from './Roles'
import Users from './Users'

const Workspace = props => {
  const title = <WorkspaceSelect />

  const tabs: AdminTab[] = [
    {
      id: 'tab-bots',
      name: 'Bots',
      route: '/workspace/:workspaceId?/bots',
      icon: <MdAndroid />,
      component: Bots,
      res: 'user.bots.*',
      op: 'read',
      size: 11
    },
    {
      id: 'tab-collaborators',
      name: 'Collaborators',
      route: '/workspace/:workspaceId?/users',
      icon: <MdPeople />,
      component: Users,
      res: 'admin.collaborators.*',
      op: 'read',
      proOnly: true
    },
    {
      id: 'tab-roles',
      name: 'Roles',
      route: '/workspace/:workspaceId?/roles',
      icon: <MdVerifiedUser />,
      component: Roles,
      res: 'admin.roles.*',
      op: 'read',
      proOnly: true
    }
  ]

  useEffect(() => {
    // Redirects the user to a valid location if parts of it is ommitted
    // @ts-ignore
    if (!tabs.find(x => matchPath(props.location.pathname, { path: x.route }))) {
      const workspaceId = getActiveWorkspace()
      workspaceId && props.history.push(generatePath(tabs[0].route, { workspaceId }))
    }
  }, [])

  return <TabLayout {...{ title, tabs, ...props }} />
}

export default Workspace
