import { MenuItem, Icon } from '@blueprintjs/core'
import { IconSvgPaths16 } from '@blueprintjs/icons'
import { ModuleDefinition } from 'botpress/sdk'
import React, { FC, Fragment } from 'react'

import { history } from '~/app/store'

interface Props {
  botId: string
  loadedModules: ModuleDefinition[]
}

export const WorkspaceAppItems: FC<Props> = ({ botId, loadedModules }) => {
  return (
    <Fragment>
      {loadedModules
        .filter(x => x.workspaceApp)
        .map(module => {
          const iconPath = `assets/modules/${module.name}/admin_${module.menuIcon}`

          const moduleIcon =
            module.menuIcon && IconSvgPaths16[module.menuIcon] ? (
              <Icon icon={module.menuIcon as any} iconSize={16} />
            ) : (
              <img src={iconPath} />
            )

          return (
            <MenuItem
              id={`btn-menu-${module.name}`}
              text={module.menuText}
              icon={moduleIcon as any}
              onClick={() => history.push(`/apps/${module.name}/${botId}`)}
              resource={`module.${module.name}`}
            />
          )
        })}
    </Fragment>
  )
}
