import { lang } from '../translations'

import { QuickShortcut } from './typings'

export const getCommonShortcuts = () => {
  const adminShortcuts: QuickShortcut[] = [
    {
      label: `${lang('sideMenu.workspace')} - ${lang('sideMenu.bots')}`,
      type: 'goto',
      url: '/workspace/:workspaceId?/bots',
      permission: { resource: 'user.bots.*', operation: 'read' }
    },
    {
      label: `${lang('sideMenu.workspace')} - ${lang('sideMenu.collaborators')}`,
      type: 'goto',
      url: '/workspace/:workspaceId?/users',
      permission: { resource: 'admin.collaborators.*', operation: 'read' }
    },
    {
      label: `${lang('sideMenu.workspace')} - ${lang('sideMenu.roles')}`,
      type: 'goto',
      url: '/workspace/:workspaceId?/roles',
      permission: { resource: 'user.roles.*', operation: 'read' }
    },
    {
      label: `${lang('sideMenu.workspace')} - ${lang('sideMenu.logs')}`,
      type: 'goto',
      url: '/workspace/:workspaceId?/logs',
      permission: { resource: 'user.logs', operation: 'read' }
    },
    {
      label: `${lang('sideMenu.management')} - ${lang('sideMenu.sourceControl')}`,
      type: 'goto',
      url: '/server/version',
      permission: { superAdmin: true }
    },
    {
      label: `${lang('sideMenu.management')} - ${lang('sideMenu.serverLicense')}`,
      type: 'goto',
      url: '/server/license',
      permission: { superAdmin: true }
    },
    {
      label: `${lang('sideMenu.management')} - ${lang('sideMenu.languages')}`,
      type: 'goto',
      url: '/server/languages',
      permission: { superAdmin: true }
    },
    {
      label: `${lang('sideMenu.management')} - ${lang('sideMenu.modules')}`,
      type: 'goto',
      url: '/modules',
      permission: { superAdmin: true }
    },
    {
      label: `${lang('sideMenu.management')} - ${lang('sideMenu.productionChecklist')}`,
      type: 'goto',
      url: '/checklist',
      permission: { superAdmin: true }
    },
    {
      label: `${lang('sideMenu.health')} - ${lang('sideMenu.monitoring')}`,
      type: 'goto',
      url: '/server/monitoring',
      permission: { superAdmin: true }
    },
    {
      label: `${lang('sideMenu.health')} - ${lang('sideMenu.alerting')}`,
      type: 'goto',
      url: '/server/alerting',
      permission: { superAdmin: true }
    },
    {
      label: `${lang('sideMenu.health')} - ${lang('sideMenu.debug')}`,
      type: 'goto',
      url: '/server/debug',
      permission: { superAdmin: true }
    },
    {
      label: `${lang('sideMenu.announcements')} - ${lang('sideMenu.latestReleases')}`,
      type: 'goto',
      url: '/latestReleases'
    }
  ]

  const shortcuts: QuickShortcut[] = [
    {
      label: lang('commander.links.documentation'),
      type: 'popup',
      category: 'external',
      url: 'https://botpress.io/docs/introduction/'
    },
    ...adminShortcuts.map(x => ({ ...x, category: 'admin', location: 'admin' as any }))
  ]

  return shortcuts
}
