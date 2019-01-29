import React from 'react'
import Profile from './Profile'
import BotpressAccount from './BotpressAccount'
import TabLayout from '../Layouts/Tabs'
import { MdPerson, MdSubscriptions } from 'react-icons/lib/md'

const MyAccount = props => {
  const title = 'My Account'
  const tabs = [
    {
      name: 'My Profile',
      route: '/profile',
      icon: <MdPerson />,
      component: Profile
    },
    {
      name: 'My Botpress Account',
      route: '/profile/account',
      icon: <MdSubscriptions />,
      component: BotpressAccount
    }
  ]

  return <TabLayout {...{ title, tabs, ...props, showHome: true }} />
}

export default MyAccount
