import { Icon } from '@blueprintjs/core'
import { IconName, IconSvgPaths16 } from '@blueprintjs/icons'
import { lang, MenuItem } from 'botpress/shared'
import React, { Fragment } from 'react'
import { PermissionAllowedProps } from '~/components/Shared/Utils/typings'
import { isOperationAllowed } from '~/components/Shared/Utils/AccessControl'

const formatModuleItem = ({ name, menuIcon, menuText, experimental }): MenuItem => {
  const path = `/modules/${name}`
  const iconPath = `assets/modules/${name}/icon.png`

  const icon =
    menuIcon === 'custom' ? (
      <img className="bp-custom-icon" src={iconPath} />
    ) : IconSvgPaths16[menuIcon] ? (
      <Icon icon={menuIcon} iconSize={16} />
    ) : (
      <i className="icon material-icons">{menuIcon}</i>
    )

  return {
    id: name,
    name: menuText || name,
    path,
    tooltip: (
      <Fragment>
        <span>{lang.tr(`module.${name}.fullName`) || menuText}</span>
        {experimental && <span className="botpress-tag">Beta</span>}
      </Fragment>
    ),
    icon
  }
}

export const getMenuItems = modules => {
  if (!window.IS_BOT_MOUNTED) {
    return modules.filter(m => m.name === 'code-editor').map(formatModuleItem)
  }

  const menuItems: MenuItem[] = []

  if (!window.USE_ONEFLOW && isOperationAllowed({ resource: 'bot.content', operation: 'read' })) {
    menuItems.push({
      id: 'content',
      name: lang.tr('studio.sideBar.content'),
      path: '/content',
      icon: 'document' as IconName,
      tooltip: name
    })
  }

  if (isOperationAllowed({ resource: 'bot.flows', operation: 'read' })) {
    menuItems.push({
      id: 'flowBuilder',
      name: lang.tr('studio.sideBar.flowBuilder'),
      path: window.USE_ONEFLOW ? '/oneflow' : '/flows',
      icon: 'page-layout' as IconName,
      tooltip: name
    })
  }

  return [
    ...menuItems,
    ...modules
      .filter(m => !m.noInterface)
      .filter(m => !window.USE_ONEFLOW || (window.USE_ONEFLOW && !['qna', 'nlu'].includes(m.name)))
      .filter(({ name }) => isOperationAllowed({ resource: `module.${name}`, operation: 'write' }))
      .map(formatModuleItem)
  ]
}
