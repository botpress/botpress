import { Icon, Position, Tooltip } from '@blueprintjs/core'
import { IconSvgPaths16 } from '@blueprintjs/icons'
import { lang } from 'botpress/shared'
import classnames from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'
import { connect } from 'react-redux'
import { NavLink, RouteComponentProps, withRouter } from 'react-router-dom'
import { RootReducer } from '~/reducers'

import { AccessControl } from '../Shared/Utils'

import style from './Sidebar.scss'

type StateProps = ReturnType<typeof mapStateToProps>
type Props = StateProps & RouteComponentProps

const BASIC_MENU_ITEMS = [
  {
    name: lang.tr('content'),
    path: '/content',
    rule: { res: 'bot.content', op: 'read' },
    icon: 'description'
  },
  {
    name: lang.tr('flows'),
    path: '/flows',
    rule: { res: 'bot.flows', op: 'read' },
    icon: 'page-layout'
  }
]

const configItem = {
  name: lang.tr('configuration'),
  path: '/config',
  rule: { res: 'admin.bots.*', op: 'write' },
  icon: 'cog'
}

const Sidebar: FC<Props> = props => {
  const renderModuleItem = module => {
    const rule = { res: `module.${module.name}`, op: 'write' }
    const path = `/modules/${module.name}`
    const iconPath = `assets/modules/${module.name}/icon.png`

    const moduleIcon =
      module.menuIcon === 'custom' ? (
        <img className={classnames(style.customIcon, 'bp-custom-icon')} src={iconPath} />
      ) : IconSvgPaths16[module.menuIcon] ? (
        <Icon icon={module.menuIcon} iconSize={16} />
      ) : (
        <i className="icon material-icons">{module.menuIcon}</i>
      )

    return (
      <AccessControl key={`menu_module_${module.name}`} resource={rule.res} operation={rule.op}>
        <li id={`bp-menu_${module.name}`}>
          <Tooltip
            boundary="window"
            position={Position.RIGHT}
            content={
              <div className={style.tooltipContent}>
                <span>{lang.tr(`module.${module.name}.fullName`) || module.menuText}</span>
                {module.experimental && <span className={style.tag}>Beta</span>}
              </div>
            }
          >
            <NavLink to={path} title={module.menuText} activeClassName={style.active}>
              {moduleIcon} {module.experimental && <span className={style.small_tag}>Beta</span>}
            </NavLink>
          </Tooltip>
        </li>
      </AccessControl>
    )
  }

  const renderBasicItem = ({ name, path, rule, icon }) => (
    <AccessControl resource={rule.res} operation={rule.op} key={name}>
      <li id={`bp-menu_${name}`} key={path}>
        <Tooltip boundary="window" position={Position.RIGHT} content={name}>
          <NavLink to={path} title={name} activeClassName={style.active}>
            {IconSvgPaths16[icon] ? <Icon icon={icon} iconSize={16} /> : <i className="icon material-icons">{icon}</i>}
          </NavLink>
        </Tooltip>
      </li>
    </AccessControl>
  )

  return (
    <aside className={classnames(style.sidebar, 'bp-sidebar')}>
      <a href="admin/" className={classnames(style.logo, 'bp-logo')}>
        <img width="19" src="assets/ui-studio/public/img/logo-icon.svg" alt="Botpress Logo" />
      </a>
      <ul className={classnames('nav')}>
        {window.IS_BOT_MOUNTED ? (
          <Fragment>
            {BASIC_MENU_ITEMS.map(renderBasicItem)}
            {props.modules.filter(m => !m.noInterface).map(renderModuleItem)}
            {renderBasicItem(configItem)}
          </Fragment>
        ) : (
          <Fragment>
            {props.modules.filter(m => m.name === 'code-editor').map(renderModuleItem)}
            {renderBasicItem(configItem)}
          </Fragment>
        )}
      </ul>
    </aside>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  viewMode: state.ui.viewMode,
  modules: state.modules
})

export default withRouter(connect(mapStateToProps)(Sidebar))
