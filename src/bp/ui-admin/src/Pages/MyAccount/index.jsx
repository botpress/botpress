import React from 'react'
import Profile from './Profile'
import TabLayout from '../Layouts/Tabs'
import { MdPerson } from 'react-icons/md'

const MyAccount = props => {
  const title = 'My Account'
  const tabs = [
    {
      name: 'My Profile',
      route: '/profile/me',
      icon: <MdPerson />,
      component: Profile
    }
  ]

  return <TabLayout {...{ title, tabs, ...props, showHome: true }} />
}

export default MyAccount
