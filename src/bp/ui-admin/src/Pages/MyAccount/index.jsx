import React from 'react'
import Profile from './Profile'
import LicensingAccount from './LicensingAccount'
import TabLayout from '../Layouts/Tabs'
import { MdPerson, MdVpnKey } from 'react-icons/lib/md'

const MyAccount = props => {
  const title = 'My Account'
  const tabs = [
    {
      name: 'My Profile',
      route: '/profile/me',
      icon: <MdPerson />,
      component: Profile
    },
    {
      name: 'Botpress licensing account',
      route: '/profile/account',
      icon: <MdVpnKey />,
      component: LicensingAccount
    }
  ]

  return <TabLayout {...{ title, tabs, ...props, showHome: true }} />
}

export default MyAccount
