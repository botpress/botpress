import { Icon } from '@blueprintjs/core'
import React from 'react'
import { MdCopyright } from 'react-icons/md'

import TabLayout from '../Layouts/Tabs'

import Alerting from './Alerting'
import Debug from './Debug'
import Languages from './Languages'
import LicenseStatus from './LicenseStatus'
import Monitoring from './Monitoring'
import Versioning from './Versioning'

const Server = (props: any) => {
  const title = 'Server'
  const tabs = [
    {
      name: 'Languages',
      route: '/server/languages',
      icon: <Icon icon="globe-network" />,
      component: Languages
    },
    {
      name: 'Monitoring',
      route: '/server/monitoring',
      icon: <Icon icon="timeline-line-chart" />,
      useFullWidth: true,
      proOnly: true,
      component: Monitoring
    },
    {
      name: 'Incidents',
      route: '/server/alerting',
      icon: <Icon icon="notifications" />,
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
      name: 'Version Control',
      route: '/server/version',
      icon: <Icon icon="changes" />,
      component: Versioning
    },
    {
      name: 'Debug',
      route: '/server/debug',
      icon: <Icon icon="console" />,
      component: Debug
    }
  ]

  return <TabLayout {...{ title, tabs, ...props, showHome: true }} />
}

export default Server
