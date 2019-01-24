import React from 'react'
import Versioning from './VersioningTab'
import LicenseStatusTab from './LicenseStatusTab'
import TabLayout from '../Layouts/Tabs'
import { MdCompareArrows, MdCopyright } from 'react-icons/lib/md'

const ServerSettings = props => {
  const title = 'Server Settings'
  const tabs = [
    {
      name: 'Server License',
      icon: <MdCopyright />,
      component: <LicenseStatusTab />
    },
    {
      name: 'Version control',
      icon: <MdCompareArrows />,
      component: <Versioning />
    }
  ]

  return <TabLayout {...{ title, tabs, ...props, showHome: true }} />
}

export default ServerSettings
