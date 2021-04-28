import { MenuItem, Icon } from '@blueprintjs/core'
import { IconSvgPaths16 } from '@blueprintjs/icons'
import { ModuleDefinition } from 'botpress/sdk'
import cx from 'classnames'
import React, { FC, useEffect, Fragment } from 'react'

import { history } from '~/app/store'
import style from './style.scss'

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
          const iconPath = `assets/modules/${module.name}/icon.png`

          const moduleIcon =
            module.menuIcon === 'custom' ? (
              <img className={cx(style.customIcon, 'bp-custom-icon')} src={iconPath} />
            ) : module.menuIcon && IconSvgPaths16[module.menuIcon] ? (
              <Icon icon={module.menuIcon as any} iconSize={16} />
            ) : (
              <i className="icon material-icons">{module.menuIcon}</i>
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
