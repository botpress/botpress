import { MenuItem, Icon } from '@blueprintjs/core'
import { IconSvgPaths16 } from '@blueprintjs/icons'
import { ModuleDefinition } from 'botpress/sdk'
import React, { FC, Fragment } from 'react'

import { history } from '~/app/store'

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
  return (
    <Fragment>
      {loadedModules
        .filter(x => x.workspaceApp?.bots)
        .map(addModuleIcon)
        .map(module => (
          <MenuItem
            id={`btn-menu-${module.name}`}
            key={module.name}
            text={module.menuText}
            icon={module.menuIcon as any}
            onClick={() => history.push(`/apps/${module.name}/${botId}`)}
            resource={`module.${module.name}`}
          />
        ))}
    </Fragment>
  )
}
