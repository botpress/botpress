import React from 'react'
import { MdCompareArrows, MdCopyright, MdLanguage, MdMultilineChart, MdNotifications } from 'react-icons/md'

import TabLayout from '../Layouts/Tabs'

import Alerting from './Alerting'
import Languages from './Languages'
import LicenseStatus from './LicenseStatus'
import Monitoring from './Monitoring'
import Versioning from './Versioning'

const Server = (props: any) => {
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
    },
    {
      name: 'Languages',
      route: '/server/languages',
      icon: <MdLanguage />,
      component: Languages
    }
  ]

  return <TabLayout {...{ title, tabs, ...props, showHome: true }} />
}

export default Server
