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
  let menuItems: MenuItem[] = [...modules.filter(m => m.name === 'code-editor').map(formatModuleItem)]

  if (window.IS_BOT_MOUNTED) {
    menuItems = [
      ...(isOperationAllowed({ res: 'bot.flows', op: 'read' } as PermissionAllowedProps)
        ? [
            {
              name: lang.tr('studio.sideBar.flowBuilder'),
              path: window.USE_ONEFLOW ? '/oneflow' : '/flows',
              icon: 'page-layout' as IconName,
              tooltip: name
            }
          ]
        : []),
      ...modules
        .filter(m => !m.noInterface)
        .filter(({ name }) => isOperationAllowed({ res: `module.${name}`, op: 'write' } as PermissionAllowedProps))
        .map(formatModuleItem)
    ]
  }

  return menuItems
}
