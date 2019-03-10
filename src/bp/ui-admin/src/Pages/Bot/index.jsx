import React from 'react'
import { MdAndroid } from 'react-icons/lib/md'

import TabLayout from '../Layouts/Tabs'
import Details from './Details'

const Bot = props => {
  const title = 'Bot Configuration'
  const tabs = [
    {
      name: 'Settings & Details',
      route: '/bot/:botId/details',
      icon: <MdAndroid />,
      component: Details,
      res: 'admin.bots.*',
      op: 'write'
    }
  ]

  return <TabLayout {...{ title, tabs, ...props, showHome: true }} />
}

export default Bot
