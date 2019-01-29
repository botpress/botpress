import React from 'react'
import Versioning from './Versioning'
import LicenseStatus from './LicenseStatus'
import TabLayout from '../Layouts/Tabs'
import { MdCompareArrows, MdCopyright } from 'react-icons/lib/md'

const ServerSettings = props => {
  const title = 'Server Settings'
  const tabs = [
    {
      name: 'Server License',
      route: '/settings',
      icon: <MdCopyright />,
      component: LicenseStatus
    },
    {
      name: 'Version control',
      route: '/settings/version',
      icon: <MdCompareArrows />,
      component: Versioning
    }
  ]

  return <TabLayout {...{ title, tabs, ...props, showHome: true }} />
}

export default ServerSettings
