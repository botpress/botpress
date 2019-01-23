import React from 'react'
import ProfileTab from './ProfileTab'
import BotpressAccountTab from './BotpressAccountTab'
import TabLayout from '../Layouts/Tabs'
import { MdPerson, MdSubscriptions } from 'react-icons/lib/md'

const MyAccount = props => {
  const title = 'My Account'
  const tabs = [
    {
      name: 'My Profile',
      icon: <MdPerson />,
      component: <ProfileTab />
    },
    {
      name: 'My Botpress Account',
      icon: <MdSubscriptions />,
      component: <BotpressAccountTab />
    }
  ]

  return <TabLayout {...{ title, tabs, ...props, showHome: true }} />
}

export default MyAccount
