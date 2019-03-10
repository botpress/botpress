import React from 'react'
import { MdCompareArrows, MdCopyright, MdMultilineChart, MdNotifications } from 'react-icons/lib/md'

import Versioning from './Versioning'
import LicenseStatus from './LicenseStatus'
import TabLayout from '../Layouts/Tabs'
import Monitoring from './Monitoring'
import Alerting from './Alerting'

const Server = props => {
  const title = 'Server'
  const tabs = [
    {
      name: 'Monitoring',
      route: '/server/monitoring',
      icon: <MdMultilineChart />,
      useFullWidth: true,
      proOnly: true,
      component: Monitoring
    },
    {
      name: 'Alerts & Incidents',
      route: '/server/alerting',
      icon: <MdNotifications />,
      useFullWidth: false,
      proOnly: true,
      component: Alerting
    },
    {
      name: 'Server License',
      route: '/server/license',
      icon: <MdCopyright />,
      component: LicenseStatus
    },
    {
      name: 'Version control',
      route: '/server/version',
      icon: <MdCompareArrows />,
      component: Versioning
    }
  ]

  return <TabLayout {...{ title, tabs, ...props, showHome: true }} />
}

export default Server
