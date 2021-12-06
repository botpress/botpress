import { MenuItem, Icon } from '@blueprintjs/core'
import { IconSvgPaths16 } from '@blueprintjs/icons'
import { ModuleDefinition } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import React, { FC } from 'react'

import { history } from '~/app/store'
import { isOperationAllowed } from '~/auth/AccessControl'

interface Props {
  botId: string
  loadedModules: ModuleDefinition[]
}

export const addModuleIcon = module => {
  const iconPath = `assets/modules/${module.name}/admin_${module.menuIcon}`

  const moduleIcon =
    module.menuIcon && IconSvgPaths16[module.menuIcon] ? (
      <Icon icon={module.menuIcon as any} iconSize={16} />
    ) : (
      <img src={iconPath} />
    )
  return { ...module, menuIcon: moduleIcon }
}

export const WorkspaceAppItems: FC<Props> = ({ botId, loadedModules }) => {
  const modules = loadedModules
    .filter(x => x.workspaceApp?.bots)
    .filter(module => isOperationAllowed({ resource: `module.${module.name}`, operation: 'write' }))

  if (!modules.length) {
    return null
  }

  return (
    <MenuItem icon="application" id="btn-apps" text={lang.tr('admin.apps')}>
      {modules.map(addModuleIcon).map(module => (
        <MenuItem
          id={`btn-menu-${module.name}`}
          key={module.name}
          text={lang.tr(`module.${module.name}.fullName`) || module.menuText}
          icon={module.menuIcon as any}
          onClick={() => history.push(`/apps/${module.name}/${botId}`)}
          resource={`module.${module.name}`}
        />
      ))}
    </MenuItem>
  )
}
