import React from 'react'
import Versioning from './VersioningTab'
import LicenseStatusTab from './LicenseStatusTab'
import TabLayout from '../Layouts/Tabs'

const ServerSettings = () => {
  const title = 'Server Settings'
  const tabs = [
    {
      name: 'Server License',
      component: <LicenseStatusTab />
    },
    {
      name: 'Version control',
      component: <Versioning />
    }
  ]

  return <TabLayout {...{ title, tabs }} />
}

export default ServerSettings
